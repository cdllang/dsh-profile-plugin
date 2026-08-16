/**
 * DSH个人主页插件 - Host端
 * 注册Web API路由，提供用户统计数据（profile 通过 settings 服务持久化）
 */
module.exports = {
  inject: ['sessions', 'workspaceRegistry', 'agents', 'sessionQuery', 'clientModules', 'sessionProjections', 'settings', 'webServer'],
  apply(ctx) {
    var schema = require('@deepseek-ai/schemastery');

    // 通过 settings 服务持久化用户资料（写入 ~/.dsh/settings.yaml，重启后保留）
    var profileScope = null;
    try {
      if (ctx.settings) {
        profileScope = ctx.settings.register('dshProfile', schema.object({
          name: schema.string().default('delang chen'),
          tier: schema.string().default('Plus'),
          avatar: schema.string().default(''),
        }));
      }
    } catch (e) {
      console.error('dsh-profile: settings register failed:', e);
    }

    // 从持久化 settings 读取初始 profile
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
    } catch (e) {
      console.error('dsh-profile: settings read failed:', e);
    }
    profileStore.handle = '@' + profileStore.name.toLowerCase().replace(/\s+/g, '');

    // 持久化保存函数
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
        } catch (e) {
          console.error('dsh-profile: settings save failed:', e);
        }
      }
    }

    // 事件驱动的缓存：任何会话活动（新消息、工具调用等）立即失效缓存，
    // 无活动时缓存永远命中（秒回）；并发请求共享一次计算（Promise 去重）
    var statsCache = null;
    var statsInflight = null;

    // 会话有新事件 → 数据变了 → 失效缓存
    ctx.on('session/event', function() { statsCache = null; });
    // 会话销毁 → 概览数变了 → 失效缓存
    ctx.on('session/disposed', function() { statsCache = null; });

    function formatNum(n) {
      if (n === undefined || n === null) return '0';
      var num = typeof n === 'number' ? n : parseInt(n, 10);
      if (isNaN(num)) return '0';
      if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
      if (num >= 10000) return (num / 10000).toFixed(1) + '万';
      return String(num);
    }

    async function computeStats() {
      // 1. 获取所有会话（含持久化）
      var totalSessions = 0, sessionList = [];
      try { sessionList = ctx.sessionQuery ? await ctx.sessionQuery.listSessions() : []; totalSessions = sessionList.length; } catch (e) {}

      var liveAgents = 0, workspaces = 0, webPluginCount = 0;
      try { liveAgents = ctx.agents ? ctx.agents.list().length : 0; } catch (e) {}
      try { workspaces = ctx.workspaceRegistry ? ctx.workspaceRegistry.list().length : 0; } catch (e) {}
      try { var graph = ctx.clientModules ? ctx.clientModules.graph() : null; if (graph && graph.entries) webPluginCount = graph.entries.length; } catch (e) {}

      // 2. Token 统计
      //    活跃会话：内存 events + assistant/message usage 精确统计（快）
      //    持久化会话：listEvents 轻量读取（时间分布），按全局平均每事件 token 估算
      var totalTokens = 0, maxSessionTokens = 0, tokenMap = {};

      // 2a. 活跃会话精确统计
      var liveEventsTotal = 0, liveTokensTotal = 0;
      for (var i = 0; i < sessionList.length; i++) {
        var rec = sessionList[i];
        if (!rec || !rec.header || !rec.live) continue;
        var live = ctx.sessions ? ctx.sessions.get(rec.header.id) : null;
        if (!live || !live.events || live.events.length === 0) continue;

        var events = live.events;
        liveEventsTotal += events.length;
        var sessionTokens = 0;
        var dayCnt = {};

        for (var j = 0; j < events.length; j++) {
          var ev = events[j];
          if (!ev) continue;
          var evTime = ev.time || 0;
          if (ev.type === 'assistant/message' && ev.data && ev.data.usage) {
            var u = ev.data.usage;
            var evTokens = (u.inputTokens || 0) + (u.outputTokens || 0) + (u.cacheReadTokens || 0) + (u.cacheWriteTokens || 0);
            if (evTokens > 0) {
              sessionTokens += evTokens;
              liveTokensTotal += evTokens;
              if (evTime) {
                var d = new Date(evTime); d.setHours(0, 0, 0, 0);
                var k = d.getTime();
                dayCnt[k] = (dayCnt[k] || 0) + evTokens;
              }
            }
          }
        }

        if (sessionTokens > 0) {
          totalTokens += sessionTokens;
          if (sessionTokens > maxSessionTokens) maxSessionTokens = sessionTokens;
          for (var k in dayCnt) { tokenMap[k] = (tokenMap[k] || 0) + dayCnt[k]; }
        }
      }

      // 2b. 持久化会话：listEvents 轻量估算
      var avgPerEvent = liveEventsTotal > 0 ? liveTokensTotal / liveEventsTotal : 0;
      for (var i = 0; i < sessionList.length; i++) {
        var rec = sessionList[i];
        if (!rec || !rec.header || rec.live) continue;
        try {
          var evs = ctx.sessionQuery ? await ctx.sessionQuery.listEvents(rec.header.id) : null;
          if (!evs || evs.length === 0) continue;
          var dayCnt = {};
          for (var j = 0; j < evs.length; j++) {
            if (evs[j] && evs[j].time) {
              var d = new Date(evs[j].time); d.setHours(0, 0, 0, 0);
              var k = d.getTime();
              dayCnt[k] = (dayCnt[k] || 0) + 1;
            }
          }
          var estTokens = Math.round(evs.length * avgPerEvent);
          if (estTokens > 0) {
            totalTokens += estTokens;
            if (estTokens > maxSessionTokens) maxSessionTokens = estTokens;
            for (var k in dayCnt) {
              tokenMap[k] = (tokenMap[k] || 0) + Math.round(estTokens * dayCnt[k] / evs.length);
            }
          }
        } catch (e) {}
      }

      // 3. 构建 35 周热力图
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
      for (var w = 0; w < totalWeeks; w++) { var max = (w===totalWeeks-1)?lastDays:7; for (var d = 0; d < max; d++) { var dd = new Date(st + w*msW + d*msD); var dk = new Date(dd); dk.setHours(0,0,0,0); dayData.push({month:months[dd.getMonth()], day:dd.getDate(), count:0, tokens:tokenMap[dk.getTime()]||0}); } }

      // 4. 按会话创建日期填充热力图颜色（count）
      var sDates = [];
      for (var i = 0; i < sessionList.length; i++) { try { var ca = sessionList[i].header.createdAt; if (ca) sDates.push(new Date(ca)); } catch(e){} }
      for (var i = 0; i < sDates.length; i++) { var d = sDates[i]; var diff = d.getTime()-st; if (diff<0) continue; var wi = Math.floor(diff/msW); if (wi>=totalWeeks) continue; rows[d.getDay()][wi] += 1; }
      var di = 0;
      for (var w = 0; w < totalWeeks; w++) { var max = (w===totalWeeks-1)?lastDays:7; for (var d = 0; d < max; d++) { if (dayData[di]) dayData[di].count = rows[d][w]; di++; } }
      var maxC = 0; for (var d = 0; d < 7; d++) { for (var w = 0; w < totalWeeks; w++) { if (rows[d][w] > maxC) maxC = rows[d][w]; } }
      if (maxC > 0) { for (var d = 0; d < 7; d++) { for (var w = 0; w < totalWeeks; w++) { var v = rows[d][w]; if (v===0) rows[d][w]=0; else if (v<=maxC*0.25) rows[d][w]=1; else if (v<=maxC*0.5) rows[d][w]=2; else if (v<=maxC*0.75) rows[d][w]=3; else rows[d][w]=4; } } }

      // 5. 连续天数
      var curS = 0, longS = 0, dayM = {};
      for (var i = 0; i < sDates.length; i++) { var d = new Date(sDates[i]); d.setHours(0,0,0,0); dayM[d.getTime()] = (dayM[d.getTime()]||0)+1; }
      var dk = Object.keys(dayM).map(Number).sort(function(a,b){return a-b;}), pd = null, sr = 0;
      for (var i = 0; i < dk.length; i++) { if (pd!==null) { var diff = (dk[i]-pd)/msD; if (diff===1) sr++; else { if (sr>longS) longS=sr; sr=1; } } else sr=1; pd=dk[i]; }
      if (sr>longS) longS=sr;
      var cd = new Date(now.getTime()); cd.setHours(0,0,0,0); cd = new Date(cd.getTime()-msD); curS=0;
      while (true) { var k = cd.getTime(); if (dayM[k]) { curS++; cd = new Date(cd.getTime()-msD); } else break; }

      // 6. 最长聊天时长（按最大事件数估算）
      var longest = '0分钟';
      try { var maxE = 0; for (var i = 0; i < sessionList.length; i++) { try { if (sessionList[i].live) { var live = ctx.sessions ? ctx.sessions.get(sessionList[i].header.id) : null; if (live && live.events) { var cnt = live.events.length; if (cnt > maxE) maxE = cnt; } } } catch(e){} } if (maxE>500) longest='3小时'; else if (maxE>200) longest='2小时'; else if (maxE>100) longest='1小时'; else if (maxE>50) longest='30分钟'; else if (maxE>0) longest='10分钟'; } catch(e){}

      return {
        profile: profileStore,
        stats: { totalTokens: formatNum(totalTokens), peakTokens: formatNum(maxSessionTokens||totalTokens), longestChat: longest, currentStreak: curS+' 天', longestStreak: longS+' 天' },
        tokenActivity: { months: mLabels, heatmapRows: rows, dayData: dayData, lastWeekDays: lastDays },
        overview: { workspaces: workspaces, sessions: totalSessions, plugins: webPluginCount, agents: liveAgents }
      };
    }

    // 带缓存的 getStats（事件驱动失效 + Promise 去重）
    function getStats() {
      if (statsCache) return Promise.resolve(statsCache);
      if (!statsInflight) {
        statsInflight = computeStats().then(function(result) {
          statsCache = result;
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