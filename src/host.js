/**
 * DSH 个人主页插件 - Host 端
 * 
 * 提供 profile-stats 和 save-profile 两个 RPC 端点
 * 数据来源：DSH 本地服务 (sessionProjections, sessionQuery, workspaceRegistry 等)
 */

module.exports = {
  inject: [
    'sessionPersistence',
    'sessions',
    'workspaceRegistry',
    'agents',
    'sessionQuery',
    'tools',
    'clientModules',
    'settings',
    'sessionProjections',
  ],
  apply(ctx) {
    const h = harness;

    var profileStore = { name: 'delang chen', handle: '@cdllang', tier: 'Plus', avatar: null };

    function formatNum(n) {
      if (n === undefined || n === null) return '0';
      var num = typeof n === 'number' ? n : parseInt(n, 10);
      if (isNaN(num)) return '0';
      if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
      if (num >= 10000) return (num / 10000).toFixed(1) + '万';
      return String(num);
    }

    // 保存用户自定义资料
    h.handle('save-profile', async (args) => {
      profileStore.name = args.name || profileStore.name;
      profileStore.avatar = args.avatar !== undefined ? args.avatar : profileStore.avatar;
      profileStore.tier = args.tier || profileStore.tier;
      return { ok: true };
    });

    // 获取统计数据
    h.handle('profile-stats', async (args) => {
      var totalSessions = 0;
      var sessionList = [];
      try {
        sessionList = ctx.sessionQuery ? await ctx.sessionQuery.listSessions() : [];
        totalSessions = sessionList.length;
      } catch (e) {}

      var liveAgents = 0;
      try {
        var agentList = ctx.agents ? ctx.agents.list() : [];
        liveAgents = agentList.length;
      } catch (e) {}

      var workspaces = 0;
      try {
        var wsList = ctx.workspaceRegistry ? ctx.workspaceRegistry.list() : [];
        workspaces = wsList.length;
      } catch (e) {}

      var webPluginCount = 0;
      try {
        var graph = ctx.clientModules ? ctx.clientModules.graph() : null;
        if (graph && graph.entries) webPluginCount = graph.entries.length;
      } catch (e) {}

      // 从 sessionProjections 获取真实 Token 用量
      var totalInputTokens = 0, totalOutputTokens = 0, totalCacheRead = 0, totalCacheWrite = 0;
      var maxSessionTokens = 0;
      var sessionTokenMap = {};

      try {
        var allSessions = ctx.sessions ? ctx.sessions.list() : [];
        for (var i = 0; i < allSessions.length; i++) {
          try {
            var session = allSessions[i];
            var projection = ctx.sessionProjections ? ctx.sessionProjections.snapshot(session) : null;
            var usage = projection && projection.values ? projection.values.tokenUsage : null;

            if (usage) {
              var inputT = usage.uncachedInputTokens || 0;
              var outputT = usage.outputTokens || 0;
              var cacheR = usage.cacheReadTokens || 0;
              var cacheW = usage.cacheWriteTokens || 0;
              var sessionTotal = inputT + outputT + cacheR + cacheW;

              totalInputTokens += inputT; totalOutputTokens += outputT;
              totalCacheRead += cacheR; totalCacheWrite += cacheW;
              if (sessionTotal > maxSessionTokens) maxSessionTokens = sessionTotal;

              // 按事件时间分布 Token
              var events = session.events ? session.events : [];
              if (Array.isArray(events) && events.length > 0) {
                var eventDayCount = {};
                var totalEvents = 0;
                for (var j = 0; j < events.length; j++) {
                  var ev = events[j];
                  var evTime = ev && ev.time ? ev.time : null;
                  if (evTime) {
                    var d = new Date(evTime); d.setHours(0, 0, 0, 0);
                    var key = d.getTime();
                    eventDayCount[key] = (eventDayCount[key] || 0) + 1;
                    totalEvents++;
                  }
                }
                if (totalEvents > 0) {
                  for (var key in eventDayCount) {
                    var proportion = eventDayCount[key] / totalEvents;
                    sessionTokenMap[key] = (sessionTokenMap[key] || 0) + Math.round(sessionTotal * proportion);
                  }
                }
              } else {
                var createdAt = session.header && session.header.createdAt;
                if (createdAt) {
                  var d = new Date(createdAt); d.setHours(0, 0, 0, 0);
                  var key = d.getTime();
                  sessionTokenMap[key] = (sessionTokenMap[key] || 0) + sessionTotal;
                }
              }
            }
          } catch (e2) {}
        }
      } catch (e) {}

      var totalTokens = totalInputTokens + totalOutputTokens + totalCacheRead + totalCacheWrite;

      var now = new Date();

      // === 35 周热力图 ===
      var totalWeeks = 35;

      var startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setDate(startDate.getDate() - (totalWeeks - 1) * 7);

      var today = new Date(now);
      today.setHours(0, 0, 0, 0);

      var todayDayOfWeek = today.getDay();
      var lastWeekDays = todayDayOfWeek + 1;

      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var monthLabels = [];
      for (var w = 0; w < totalWeeks; w++) {
        var d = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
        var m = d.getMonth();
        var show = (w === 0 || w === totalWeeks - 1) ? true : (new Date(startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000).getMonth() !== m);
        monthLabels.push(show ? monthNames[m] : '');
      }

      var msPerWeek = 7 * 24 * 60 * 60 * 1000;
      var msPerDay = 24 * 60 * 60 * 1000;
      var startTime = startDate.getTime();

      var heatmapRows = [];
      for (var d = 0; d < 7; d++) {
        var row = [];
        for (var w = 0; w < totalWeeks; w++) row.push(0);
        heatmapRows.push(row);
      }

      var dayData = [];
      for (var w = 0; w < totalWeeks; w++) {
        var maxDayThisWeek = (w === totalWeeks - 1) ? lastWeekDays : 7;
        for (var d = 0; d < maxDayThisWeek; d++) {
          var dayDate = new Date(startTime + w * msPerWeek + d * msPerDay);
          var dayKey = new Date(dayDate); dayKey.setHours(0, 0, 0, 0);
          var dayTokens = sessionTokenMap[dayKey.getTime()] || 0;
          dayData.push({ month: monthNames[dayDate.getMonth()], day: dayDate.getDate(), count: 0, tokens: dayTokens });
        }
      }

      var sessionDates = [];
      for (var i = 0; i < sessionList.length; i++) {
        try {
          var createdAt = sessionList[i].header.createdAt;
          if (createdAt) sessionDates.push(new Date(createdAt));
        } catch (e) {}
      }

      for (var i = 0; i < sessionDates.length; i++) {
        var d = sessionDates[i];
        var diff = d.getTime() - startTime;
        if (diff < 0) continue;
        var weekIdx = Math.floor(diff / msPerWeek);
        if (weekIdx >= totalWeeks) continue;
        heatmapRows[d.getDay()][weekIdx] += 1;
      }

      var di = 0;
      for (var w = 0; w < totalWeeks; w++) {
        var maxDay = (w === totalWeeks - 1) ? lastWeekDays : 7;
        for (var d = 0; d < maxDay; d++) {
          if (dayData[di]) dayData[di].count = heatmapRows[d][w];
          di++;
        }
      }

      var maxCount = 0;
      for (var d = 0; d < 7; d++) {
        for (var w = 0; w < totalWeeks; w++) {
          if (heatmapRows[d][w] > maxCount) maxCount = heatmapRows[d][w];
        }
      }

      if (maxCount > 0) {
        for (var d = 0; d < 7; d++) {
          for (var w = 0; w < totalWeeks; w++) {
            var val = heatmapRows[d][w];
            if (val === 0) { heatmapRows[d][w] = 0; }
            else if (val <= maxCount * 0.25) { heatmapRows[d][w] = 1; }
            else if (val <= maxCount * 0.5) { heatmapRows[d][w] = 2; }
            else if (val <= maxCount * 0.75) { heatmapRows[d][w] = 3; }
            else { heatmapRows[d][w] = 4; }
          }
        }
      }

      // 连续天数计算
      var currentStreak = 0, longestStreak = 0;
      var dayMap = {};
      for (var i = 0; i < sessionDates.length; i++) {
        var d = new Date(sessionDates[i]); d.setHours(0, 0, 0, 0);
        dayMap[d.getTime()] = (dayMap[d.getTime()] || 0) + 1;
      }
      var dayKeys = Object.keys(dayMap).map(Number).sort(function(a, b) { return a - b; });
      var prevDay = null, streakRunning = 0;
      for (var i = 0; i < dayKeys.length; i++) {
        if (prevDay !== null) {
          var diff = (dayKeys[i] - prevDay) / msPerDay;
          if (diff === 1) { streakRunning++; }
          else { if (streakRunning > longestStreak) longestStreak = streakRunning; streakRunning = 1; }
        } else { streakRunning = 1; }
        prevDay = dayKeys[i];
      }
      if (streakRunning > longestStreak) longestStreak = streakRunning;

      var checkDay = new Date(now.getTime()); checkDay.setHours(0, 0, 0, 0);
      checkDay = new Date(checkDay.getTime() - msPerDay);
      currentStreak = 0;
      while (true) {
        var key = checkDay.getTime();
        if (dayMap[key]) { currentStreak++; checkDay = new Date(checkDay.getTime() - msPerDay); }
        else { break; }
      }

      var longestChatDuration = '0分钟';
      try {
        var allSessionsLive = ctx.sessions ? ctx.sessions.list() : [];
        var maxEventCount = 0;
        for (var i = 0; i < allSessionsLive.length; i++) {
          try {
            var events = allSessionsLive[i].events;
            var cnt = Array.isArray(events) ? events.length : 0;
            if (cnt > maxEventCount) maxEventCount = cnt;
          } catch (e) {}
        }
        if (maxEventCount > 500) longestChatDuration = '3小时';
        else if (maxEventCount > 200) longestChatDuration = '2小时';
        else if (maxEventCount > 100) longestChatDuration = '1小时';
        else if (maxEventCount > 50) longestChatDuration = '30分钟';
        else if (maxEventCount > 0) longestChatDuration = '10分钟';
      } catch (e) {}

      return {
        profile: profileStore,
        stats: {
          totalTokens: formatNum(totalTokens),
          peakTokens: formatNum(maxSessionTokens || totalTokens),
          longestChat: longestChatDuration,
          currentStreak: String(currentStreak) + ' 天',
          longestStreak: String(longestStreak) + ' 天',
        },
        tokenActivity: { months: monthLabels, heatmapRows: heatmapRows, dayData: dayData, lastWeekDays: lastWeekDays },
        overview: { workspaces: workspaces, sessions: totalSessions, plugins: webPluginCount, agents: liveAgents },
      };
    });
  },
};