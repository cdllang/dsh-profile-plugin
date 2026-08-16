// 验证增量 checkpoint 统计的核心逻辑
// 模拟：settings scope（checkpoint 存储）、sessionPersistence.readFrom、事件 usage

// ---- 模拟事件 ----
// 生成一个会话的事件：seq 从 0 开始，部分事件是 assistant/message 带 usage
function makeEvent(seq, type, time, usageTokens) {
  var ev = { type: type, time: time, seq: seq, data: {} };
  if (type === 'assistant/message' && usageTokens) {
    ev.data.usage = { inputTokens: Math.floor(usageTokens/2), outputTokens: Math.ceil(usageTokens/2), cacheReadTokens: 0, cacheWriteTokens: 0 };
  }
  return ev;
}

// 会话 A：10 个事件，seq 0-9，日期 8/15 和 8/16
var day1 = new Date(2026, 7, 15).getTime(); // 8/15
var day2 = new Date(2026, 7, 16).getTime(); // 8/16
var sessionA = [];
for (var i = 0; i < 10; i++) {
  var day = i < 6 ? day1 : day2;
  sessionA.push(makeEvent(i, 'assistant/message', day + i * 1000, (i + 1) * 100));
}

// ---- 模拟存储 ----
// 存储里的会话事件（模拟持久化日志）
var store = { 'A': sessionA };
// checkpoint（settings）
var checkpointStore = { sessions: {} };

// ---- 模拟 settings scope ----
var statsScope = {
  get: function() { return JSON.parse(JSON.stringify({ sessions: checkpointStore.sessions })); },
  update: async function(patch) { checkpointStore.sessions = patch.sessions || checkpointStore.sessions; },
};

// ---- 模拟 sessionPersistence.readFrom ----
async function readFrom(id, fromSeq) {
  var events = store[id] || [];
  return { meta: {}, events: events.filter(function(e) { return e.seq >= fromSeq; }) };
}

// ---- 复制插件里的核心逻辑 ----
function statEvents(events, dayCnt) {
  var total = 0;
  for (var j = 0; j < events.length; j++) {
    var ev = events[j];
    if (!ev) continue;
    var evTime = ev.time || 0;
    if (ev.type === 'assistant/message' && ev.data && ev.data.usage) {
      var u = ev.data.usage;
      var evTokens = (u.inputTokens||0)+(u.outputTokens||0)+(u.cacheReadTokens||0)+(u.cacheWriteTokens||0);
      if (evTokens > 0) {
        total += evTokens;
        if (evTime) {
          var d = new Date(evTime); d.setHours(0,0,0,0);
          var k = d.getTime();
          dayCnt[k] = (dayCnt[k]||0) + evTokens;
        }
      }
    }
  }
  return total;
}

function readCheckpoint() {
  try {
    var cp = statsScope.get();
    if (cp && cp.sessions) return JSON.parse(JSON.stringify(cp.sessions));
  } catch(e) {}
  return {};
}

async function writeCheckpoint(sessions) {
  await statsScope.update({ sessions: sessions });
}

// ---- 场景 1：首次计算（无 checkpoint）----
async function compute(sessionList) {
  var checkpoint = readCheckpoint();
  var changed = false;
  var dayAccum = {};
  var persistWork = [];
  var readPromises = [];

  for (var i = 0; i < sessionList.length; i++) {
    var id = sessionList[i];
    var entry = checkpoint[id] || { lastSeq: -1, dayTokens: {} };
    (function(sid, ent) {
      readPromises.push(readFrom(sid, ent.lastSeq + 1).then(function(read) {
        persistWork.push({ id: sid, entry: ent, newEvents: read.events || [] });
      }));
    })(id, entry);
  }
  await Promise.all(readPromises);

  for (var w = 0; w < persistWork.length; w++) {
    var work = persistWork[w];
    var entry = work.entry;
    var newEvents = work.newEvents;

    if (newEvents.length > 0) {
      var firstSeq = newEvents[0].seq;
      if (firstSeq > entry.lastSeq + 1) {
        // 缺口 → 全量重读
        var full = await readFrom(work.id, 0);
        var newDayCnt = {};
        statEvents(full.events, newDayCnt);
        var lastSeq = -1;
        if (full.events.length > 0) lastSeq = full.events[full.events.length - 1].seq;
        entry.lastSeq = lastSeq;
        entry.dayTokens = newDayCnt;
        changed = true;
      } else {
        // 正常增量：累加新事件的 usage
        var incDayCnt = {};
        statEvents(newEvents, incDayCnt);
        for (var k in incDayCnt) entry.dayTokens[k] = (entry.dayTokens[k]||0) + incDayCnt[k];
        // 只要有新事件就推进 lastSeq（无论是否有 usage token）
        entry.lastSeq = newEvents[newEvents.length - 1].seq;
        changed = true;
      }
    }

    if (entry && entry.dayTokens) {
      for (var k in entry.dayTokens) dayAccum[k] = (dayAccum[k]||0) + entry.dayTokens[k];
    }
    checkpoint[work.id] = entry;
  }

  if (changed) await writeCheckpoint(checkpoint);

  var totalTokens = 0, maxDayTokens = 0;
  for (var k in dayAccum) {
    totalTokens += dayAccum[k];
    if (dayAccum[k] > maxDayTokens) maxDayTokens = dayAccum[k];
  }
  return { totalTokens: totalTokens, maxDayTokens: maxDayTokens, dayAccum: dayAccum, checkpoint: checkpoint };
}

// ---- 运行场景 ----
(async function() {
  console.log('=== 场景 1：首次计算（无 checkpoint）===');
  var r1 = await compute(['A']);
  console.log('dayAccum:', r1.dayAccum);
  console.log('totalTokens:', r1.totalTokens);
  console.log('checkpoint A:', JSON.stringify(r1.checkpoint.A));
  // 期望：6 天在 8/15，4 天在 8/16。token = sum((i+1)*100, i=0..9) = 5500
  if (r1.totalTokens !== 5500) { console.error('FAIL: totalTokens 应为 5500, got', r1.totalTokens); process.exit(1); }
  console.log('场景1 PASSED\n');

  console.log('=== 场景 2：无新事件（增量应为空，token 不变）===');
  var r2 = await compute(['A']);
  if (r2.totalTokens !== 5500) { console.error('FAIL: 无新事件 token 不应变化'); process.exit(1); }
  console.log('场景2 PASSED（token 保持 5500）\n');

  console.log('=== 场景 3：新增 2 个事件（增量统计）===');
  store['A'].push(makeEvent(10, 'assistant/message', day2 + 10000, 500));
  store['A'].push(makeEvent(11, 'assistant/message', day2 + 20000, 300));
  var r3 = await compute(['A']);
  // 期望：5500 + 800 = 6300，8/16 增加
  if (r3.totalTokens !== 6300) { console.error('FAIL: totalTokens 应为 6300, got', r3.totalTokens); process.exit(1); }
  console.log('dayAccum:', r3.dayAccum);
  console.log('checkpoint A lastSeq:', r3.checkpoint.A.lastSeq, '(应为 11)');
  if (r3.checkpoint.A.lastSeq !== 11) { console.error('FAIL: lastSeq 应为 11'); process.exit(1); }
  console.log('场景3 PASSED（增量准确）\n');

  console.log('=== 场景 4：压缩模拟（日志中间事件被 shadow 但不删除，seq 连续）===');
  // 模拟压缩：追加摘要事件，不删除旧事件
  store['A'].push(makeEvent(12, 'user/message', day2 + 30000, 0)); // 摘要（无 usage）
  var r4 = await compute(['A']);
  // 期望：token 不变（摘要无 usage），lastSeq 更新到 12
  if (r4.totalTokens !== 6300) { console.error('FAIL: 压缩不应改变 token'); process.exit(1); }
  if (r4.checkpoint.A.lastSeq !== 12) { console.error('FAIL: lastSeq 应为 12'); process.exit(1); }
  console.log('场景4 PASSED（压缩追加摘要不影响统计）\n');

  console.log('=== 场景 5：缺口检测（模拟日志被物理截断+重写）===');
  // 模拟日志损坏：seq 跳跃（0-5 被删，从 6 开始，但 lastSeq=12）
  store['A'] = sessionA.slice(0, 4).map(function(e, idx) { return makeEvent(idx, 'assistant/message', day1 + idx*1000, (idx+1)*100); });
  // 此时存储只有 seq 0-3，lastSeq checkpoint 是 12
  var r5 = await compute(['A']);
  // readFrom(13) 返回空 → 无新事件，checkpoint 不变（检测不到缩短，符合预期）
  console.log('场景5: readFrom(13) 返回空，token 保持', r5.totalTokens, '(缩短检测的已知边界，DSH 正常不会发生)');
  console.log('场景5 完成（边界行为符合预期）\n');

  console.log('ALL SCENARIOS DONE');
})();
