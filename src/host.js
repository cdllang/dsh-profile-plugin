/**
 * DSH个人主页插件 - Host端
 * 注册Web API路由，提供用户统计数据
 * - profile 通过 settings 服务持久化
 * - token 统计用增量 checkpoint：只读新事件（readFrom(id, lastSeq+1)），
 *   每个会话的 lastSeq 和每日 token 贡献持久化到 settings
 */
module.exports = {
  inject: ['sessions', 'sessionPersistence', 'workspaceRegistry', 'agents', 'sessionQuery', 'clientModules', 'sessionProjections', 'settings', 'webServer'],
  apply(ctx) {
    var schema = require('@deepseek-ai/schemastery');

    // ===== 用户资料持久化（settings） =====
    var profileScope = null;
    try {
      if (ctx.settings) {
        profileScope = ctx.settings.register('dshProfile', schema.object({
          name: schema.string().default('delang chen'),
          tier: schema.string().default('Plus'),
          avatar: schema.string().default(''),
        }));
      }
    } catch (e) { console.error('dsh-profile: settings register failed:', e); }

    var profileStore = { name: 'delang chen', handle: '@cdllang', tier: 'Plus', avatar: null };
    try {
      if (profileScope) {
        var saved = profileScope.get();
        if (saved) {
          profileStore.name = saved.name || profileStore.name;
          profileStore.tier = saved.tier || profileStore.tier;
          profileStore.avatar = saved.avatar || null;
        }
      }
    } catch (e) { console.error('dsh-profile: settings read failed:', e); }
    profileStore.handle = '@' + profileStore.name.toLowerCase().replace(/\s+/g, '');

    async function persistProfile(name, tier, avatar) {
      if (name !== undefined && name !== null && name !== '') profileStore.name = name;
      if (tier !== undefined && tier !== null && tier !== '') profileStore.tier = tier;
      if (avatar !== undefined) profileStore.avatar = avatar || null;
      profileStore.handle = '@' + profileStore.name.toLowerCase().replace(/\s+/g, '');
      if (profileScope) {
        try {
          await profileScope.update({
            name: profileStore.name,
            tier: profileStore.tier,
            avatar: profileStore.avatar || '',
          });
        } catch (e) { console.error('dsh-profile: settings save failed:', e); }
      }
    }

    // ===== 统计 checkpoint 持久化（settings） =====
    // 结构：{ sessions: { [sessionId]: { lastSeq: number, dayTokens: { [dayTs]: tokens } } } }
    var statsScope = null;
    try {
      if (ctx.settings) {
        statsScope = ctx.settings.register('dshProfileStats', schema.object({
          sessions: schema.dict(schema.object({
            lastSeq: schema.number(),
            dayTokens: schema.dict(schema.number()),
          })),
        }));
      }
    } catch (e) { console.error('dsh-profile: stats settings register failed:', e); }

    // 读 checkpoint（深拷贝，避免改到冻结的 resolved 对象）
    function readCheckpoint() {
      if (!statsScope) return {};
      try {
        var cp = statsScope.get();
        if (cp && cp.sessions) return JSON.parse(JSON.stringify(cp.sessions));
      } catch (e) {}
      return {};
    }

    // 写 checkpoint（merge patch，覆盖整个 sessions）
    async function writeCheckpoint(sessions) {
      if (!statsScope) return;
      try {
        await statsScope.update({ sessions: sessions });
      } catch (e) { console.error('dsh-profile: stats settings save failed:', e); }
    }

    // 统计一个事件数组的 usage，写入 dayCnt，返回该数组的 token 总和
    function statEvents(events, dayCnt) {
      var total = 0;
      for (var j = 0; j < events.length; j++) {
        var ev = events[j];
        if (!ev) continue;
        var evTime = ev.time || 0;
        if (ev.type === 'assistant/message' && ev.data && ev.data.usage) {
          var u = ev.data.usage;
          var evTokens = (u.inputTokens || 0) + (u.outputTokens || 0) + (u.cacheReadTokens || 0) + (u.cacheWriteTokens || 0);
          if (evTokens > 0) {
            total += evTokens;
            if (evTime) {
              var d = new Date(evTime); d.setHours(0, 0, 0, 0);
              var k = d.getTime();
              dayCnt[k] = (dayCnt[k] || 0) + evTokens;
            }
          }
        }
      }
      return total;
    }

    function formatNum(n) {
      if (n === undefined || n === null) return '0';
      var num = typeof n === 'number' ? n : parseInt(n, 10);
      if (isNaN(num)) return '0';
      if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
      if (num >= 10000) return (num / 10000).toFixed(1) + '万';
      return String(num);
    }

    // ===== 增量计算统计 =====
    // 并发去重：同一时刻只允许一次计算（避免 checkpoint 读改写冲突）
    var statsInflight = null;

    async function computeStats() {
      // 1. 获取所有会话（含持久化）
      var totalSessions = 0, sessionList = [];
      try { sessionList = ctx.sessionQuery ? await ctx.sessionQuery.listSessions() : []; totalSessions = sessionList.length; } catch (e) {}

      var liveAgents = 0, workspaces = 0, webPluginCount = 0;
      try { liveAgents = ctx.agents ? ctx.agents.list().length : 0; } catch (e) {}
      try { workspaces = ctx.workspaceRegistry ? ctx.workspaceRegistry.list().length : 0; } catch (e) {}
      try { var graph = ctx.clientModules ? ctx.clientModules.graph() : null; if (graph && graph.entries) webPluginCount = graph.entries.length; } catch (e) {}

      // 2. 增量 token 统计
      var checkpoint = readCheckpoint();
      var changed = false;
      var dayAccum = {}; // 汇总所有会话的每日 token（live 全量 + persisted checkpoint）

      // 2a. 活跃会话：内存 events 全量统计（快），结果直接汇总
      for (var i = 0; i < sessionList.length; i++) {
        var rec = sessionList[i];
        if (!rec || !rec.header || !rec.live) continue;
        var live = ctx.sessions ? ctx.sessions.get(rec.header.id) : null;
        if (!live || !live.events || live.events.length === 0) continue;
        var dayCnt = {};
        statEvents(live.events, dayCnt);
        for (var k in dayCnt) dayAccum[k] = (dayAccum[k] || 0) + dayCnt[k];
      }

      // 2b. 持久化会话：增量（readFrom(lastSeq+1)）+ 缺口检测（压缩/移除 → 全量重读）
      //     并行读取增量，再统一更新 checkpoint
      var persistWork = []; // { id, entry, newEvents, needFull }
      var readPromises = [];
      for (var i = 0; i < sessionList.length; i++) {
        var rec = sessionList[i];
        if (!rec || !rec.header || rec.live) continue;
        var id = rec.header.id;
        var entry = checkpoint[id] || { lastSeq: -1, dayTokens: {} };
        (function(sid, ent) {
          readPromises.push(ctx.sessionPersistence.readFrom(sid, ent.lastSeq + 1).then(function(read) {
            persistWork.push({ id: sid, entry: ent, newEvents: (read && read.events) ? read.events : [] });
          }, function() {
            persistWork.push({ id: sid, entry: ent, newEvents: null });
          }));
        })(id, entry);
      }
      await Promise.all(readPromises);

      for (var w = 0; w < persistWork.length; w++) {
        var work = persistWork[w];
        var entry = work.entry;
        var newEvents = work.newEvents;

        if (newEvents === null) {
          // 读取失败：保留 checkpoint 旧数据
        } else if (newEvents.length > 0) {
          var firstSeq = newEvents[0].seq;
          if (firstSeq > entry.lastSeq + 1) {
            // 缺口（会话被压缩/事件被移除）→ 全量重读重建该会话
            try {
              var full = await ctx.sessionPersistence.readFrom(work.id, 0);
              var fullEvents = (full && full.events) ? full.events : [];
              var newDayCnt = {};
              statEvents(fullEvents, newDayCnt);
              var lastSeq = -1;
              if (fullEvents.length > 0) lastSeq = fullEvents[fullEvents.length - 1].seq;
              entry.lastSeq = lastSeq;
              entry.dayTokens = newDayCnt;
              changed = true;
            } catch (e) {}
          } else {
            // 正常增量：累加新事件的 usage
            var incDayCnt = {};
            statEvents(newEvents, incDayCnt);
            for (var k in incDayCnt) entry.dayTokens[k] = (entry.dayTokens[k] || 0) + incDayCnt[k];
            // 只要有新事件就推进 lastSeq（无论是否有 usage token），
            // 避免非 usage 事件（user/message、工具调用、摘要）被重复扫描
            entry.lastSeq = newEvents[newEvents.length - 1].seq;
            changed = true;
          }
        }
        // newEvents.length === 0：无新事件，跳过（保留 checkpoint）
        // （会话缩短但 lastSeq 仍有效时无法检测，属罕见情况，可接受）

        // 汇总该会话的 dayTokens
        if (entry && entry.dayTokens) {
          for (var k in entry.dayTokens) dayAccum[k] = (dayAccum[k] || 0) + entry.dayTokens[k];
        }
        checkpoint[work.id] = entry;
      }

      // 写回 checkpoint（只更新有增量的会话）
      if (changed) await writeCheckpoint(checkpoint);

      // 3. 汇总统计
      var totalTokens = 0, maxDayTokens = 0;
      for (var k in dayAccum) {
        totalTokens += dayAccum[k];
        if (dayAccum[k] > maxDayTokens) maxDayTokens = dayAccum[k];
      }

      // 4. 构建 35 周热力图
      var now = new Date(), totalWeeks = 35;
      var start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate() - start.getDay()); start.setDate(start.getDate() - (totalWeeks-1)*7);
      var today = new Date(now); today.setHours(0,0,0,0);
      var lastDays = today.getDay() + 1;
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var mLabels = [];
      for (var w = 0; w < totalWeeks; w++) { var d = new Date(start.getTime() + w*7*24*60*60*1000); var m = d.getMonth(); mLabels.push((w===0||w===totalWeeks-1||new Date(start.getTime()+(w-1)*7*24*60*60*1000).getMonth()!==m) ? months[m] : ''); }
      var msW = 7*24*60*60*1000, msD = 24*60*60*1000, st = start.getTime();
      var rows = []; for (var d = 0; d < 7; d++) { var r = []; for (var w = 0; w < totalWeeks; w++) r.push(0); rows.push(r); }
      var dayData = [];
      for (var w = 0; w < totalWeeks; w++) { var max = (w===totalWeeks-1)?lastDays:7; for (var d = 0; d < max; d++) { var dd = new Date(st + w*msW + d*msD); var dk = new Date(dd); dk.setHours(0,0,0,0); dayData.push({month:months[dd.getMonth()], day:dd.getDate(), count:0, tokens:dayAccum[dk.getTime()]||0}); } }

      // 5. 按会话创建日期填充热力图颜色（count）
      var sDates = [];
      for (var i = 0; i < sessionList.length; i++) { try { var ca = sessionList[i].header.createdAt; if (ca) sDates.push(new Date(ca)); } catch(e){} }
      for (var i = 0; i < sDates.length; i++) { var d = sDates[i]; var diff = d.getTime()-st; if (diff<0) continue; var wi = Math.floor(diff/msW); if (wi>=totalWeeks) continue; rows[d.getDay()][wi] += 1; }
      var di = 0;
      for (var w = 0; w < totalWeeks; w++) { var max = (w===totalWeeks-1)?lastDays:7; for (var d = 0; d < max; d++) { if (dayData[di]) dayData[di].count = rows[d][w]; di++; } }
      var maxC = 0; for (var d = 0; d < 7; d++) { for (var w = 0; w < totalWeeks; w++) { if (rows[d][w] > maxC) maxC = rows[d][w]; } }
      if (maxC > 0) { for (var d = 0; d < 7; d++) { for (var w = 0; w < totalWeeks; w++) { var v = rows[d][w]; if (v===0) rows[d][w]=0; else if (v<=maxC*0.25) rows[d][w]=1; else if (v<=maxC*0.5) rows[d][w]=2; else if (v<=maxC*0.75) rows[d][w]=3; else rows[d][w]=4; } } }

      // 6. 连续天数
      var curS = 0, longS = 0, dayM = {};
      for (var i = 0; i < sDates.length; i++) { var d = new Date(sDates[i]); d.setHours(0,0,0,0); dayM[d.getTime()] = (dayM[d.getTime()]||0)+1; }
      var dk = Object.keys(dayM).map(Number).sort(function(a,b){return a-b;}), pd = null, sr = 0;
      for (var i = 0; i < dk.length; i++) { if (pd!==null) { var diff = (dk[i]-pd)/msD; if (diff===1) sr++; else { if (sr>longS) longS=sr; sr=1; } } else sr=1; pd=dk[i]; }
      if (sr>longS) longS=sr;
      var cd = new Date(now.getTime()); cd.setHours(0,0,0,0); cd = new Date(cd.getTime()-msD); curS=0;
      while (true) { var k = cd.getTime(); if (dayM[k]) { curS++; cd = new Date(cd.getTime()-msD); } else break; }

      // 7. 最长聊天时长（按最大事件数估算）
      var longest = '0分钟';
      try { var maxE = 0; for (var i = 0; i < sessionList.length; i++) { try { if (sessionList[i].live) { var live = ctx.sessions ? ctx.sessions.get(sessionList[i].header.id) : null; if (live && live.events) { var cnt = live.events.length; if (cnt > maxE) maxE = cnt; } } } catch(e){} } if (maxE>500) longest='3小时'; else if (maxE>200) longest='2小时'; else if (maxE>100) longest='1小时'; else if (maxE>50) longest='30分钟'; else if (maxE>0) longest='10分钟'; } catch(e){}

      return {
        profile: profileStore,
        stats: { totalTokens: formatNum(totalTokens), peakTokens: formatNum(maxDayTokens||totalTokens), longestChat: longest, currentStreak: curS+' 天', longestStreak: longS+' 天' },
        tokenActivity: { months: mLabels, heatmapRows: rows, dayData: dayData, lastWeekDays: lastDays },
        overview: { workspaces: workspaces, sessions: totalSessions, plugins: webPluginCount, agents: liveAgents }
      };
    }

    // getStats：增量计算，每次数据新鲜；Promise 去重避免并发 checkpoint 冲突
    function getStats() {
      if (!statsInflight) {
        statsInflight = computeStats().then(function(result) {
          statsInflight = null;
          return result;
        }, function(err) {
          statsInflight = null;
          throw err;
        });
      }
      return statsInflight;
    }

    // 注册Web API路由（kind 必填，effect 返回 disposer）
    var web = ctx.get('webServer');
    if (web) {
      ctx.effect(function() {
        return web.register({ kind: 'exact', path: '/api/dsh-profile/stats', handler: async function(req, res) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          try { var data = await getStats(); res.end(JSON.stringify(data)); }
          catch(e) { res.end(JSON.stringify({error: String(e)})); }
        }});
      }, 'dsh-profile: stats route');

      ctx.effect(function() {
        return web.register({ kind: 'exact', path: '/api/dsh-profile/save', handler: async function(req, res) {
          var body = '';
          req.on('data', function(chunk) { body += chunk; });
          req.on('end', async function() {
            try {
              var args = JSON.parse(body);
              await persistProfile(args.name, args.tier, args.avatar);
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ok:true}));
            } catch(e) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ok:false,error:String(e)}));
            }
          });
        }});
      }, 'dsh-profile: save route');
    }
  }
};