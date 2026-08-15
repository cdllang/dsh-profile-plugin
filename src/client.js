/**
 * DSH 个人主页插件 - Client 端
 * 
 * 在设置面板中注册"个人主页"页面
 * 包含：用户资料、统计卡片、概览网格、Token 热力图、编辑弹窗
 */

module.exports = {
  inject: ['slots'],
  apply(ctx) {
    const slots = ctx.get('slots');
    if (slots === undefined) return;

    // ===== 样式 =====
    styles.insert(function(){
      return '.dshp { padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', system-ui, sans-serif; color: var(--dsw-alias-label-primary, #e1e3e6); font-size: 13px; line-height: 1.5; }'
        + '.dshp * { box-sizing: border-box; }'
        + '.dshp-header { display: flex; align-items: center; gap: 14px; padding: 16px 0 20px 0; border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a2e); margin-bottom: 20px; }'
        + '.dshp-avatar-wrap { position: relative; flex-shrink: 0; cursor: pointer; }'
        + '.dshp-avatar { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; overflow: hidden; background: linear-gradient(135deg, #4fc3f7, #0d47a1); }'
        + '.dshp-avatar img { width: 100%; height: 100%; object-fit: cover; }'
        + '.dshp-avatar-overlay { position: absolute; inset: 0; border-radius: 10px; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; font-size: 10px; color: #fff; pointer-events: none; }'
        + '.dshp-avatar-wrap:hover .dshp-avatar-overlay { opacity: 1; }'
        + '.dshp-info { min-width: 0; flex: 1; }'
        + '.dshp-info h2 { margin: 0 0 1px 0; font-size: 16px; font-weight: 600; color: var(--dsw-alias-label-primary, #e1e3e6); cursor: pointer; }'
        + '.dshp-info h2:hover { color: #4fc3f7; }'
        + '.dshp-info .dshp-handle { margin: 0 0 4px 0; font-size: 12px; color: var(--dsw-alias-label-secondary, #8b8d91); }'
        + '.dshp-badge { display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: var(--dsw-alias-bg-layer-2, #26262a); color: var(--dsw-alias-label-secondary, #8b8d91); border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); cursor: pointer; }'
        + '.dshp-badge:hover { color: #4fc3f7; border-color: #4fc3f7; }'
        + '.dshp-modal { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); }'
        + '.dshp-modal-box { background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); border-radius: 12px; padding: 24px; width: 340px; }'
        + '.dshp-modal h3 { margin: 0 0 16px 0; font-size: 15px; font-weight: 600; }'
        + '.dshp-modal label { display: block; font-size: 12px; color: var(--dsw-alias-label-secondary, #8b8d91); margin-bottom: 4px; }'
        + '.dshp-modal input { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); background: var(--dsw-alias-bg-layer-2, #26262a); color: var(--dsw-alias-label-primary, #e1e3e6); font-size: 13px; margin-bottom: 12px; outline: none; }'
        + '.dshp-modal input:focus { border-color: #4fc3f7; }'
        + '.dshp-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }'
        + '.dshp-modal-btn { padding: 6px 16px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); font-size: 12px; cursor: pointer; transition: all 0.15s; }'
        + '.dshp-modal-btn.primary { background: #4fc3f7; color: #000; border-color: #4fc3f7; font-weight: 500; }'
        + '.dshp-modal-btn.primary:hover { background: #29b6f6; }'
        + '.dshp-modal-btn.secondary { background: transparent; color: var(--dsw-alias-label-secondary, #8b8d91); }'
        + '.dshp-modal-btn.secondary:hover { background: var(--dsw-alias-bg-layer-2, #26262a); }'
        + '.dshp-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }'
        + '.dshp-stat { background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); border-radius: 8px; padding: 12px 8px; text-align: center; }'
        + '.dshp-stat-val { font-size: 17px; font-weight: 700; line-height: 1.3; color: var(--dsw-alias-label-primary, #e1e3e6); margin-bottom: 2px; }'
        + '.dshp-stat-lbl { font-size: 11px; line-height: 1.3; color: var(--dsw-alias-label-secondary, #8b8d91); }'
        + '.dshp-section { margin-bottom: 20px; }'
        + '.dshp-h3 { font-size: 13px; font-weight: 600; margin: 0 0 10px 0; color: var(--dsw-alias-label-primary, #e1e3e6); display: flex; align-items: center; gap: 6px; }'
        + '.dshp-h3 .dshp-sub { font-weight: 400; font-size: 11px; color: var(--dsw-alias-label-secondary, #8b8d91); }'
        + '.dshp-heatmap-wrap { background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); border-radius: 8px; padding: 16px; overflow-x: auto; position: relative; }'
        + '.dshp-heatmap-inner { display: flex; flex-direction: row; align-items: flex-start; }'
        + '.dshp-grid { display: flex; flex-direction: row; gap: 3px; }'
        + '.dshp-col { display: flex; flex-direction: column; gap: 3px; }'
        + '.dshp-cell { width: 12px; height: 12px; border-radius: 2px; background: var(--dsw-alias-bg-layer-2, #26262a); cursor: pointer; }'
        + '.dshp-cell.l1 { background: #0d47a1; }'
        + '.dshp-cell.l2 { background: #1565c0; }'
        + '.dshp-cell.l3 { background: #1e88e5; }'
        + '.dshp-cell.l4 { background: #42a5f5; }'
        + '.dshp-cell:hover { outline: 1px solid #4fc3f7; outline-offset: 1px; }'
        + '.dshp-tooltip { position: fixed; z-index: 10000; background: #1c1c1f; border: 1px solid #2a2a2e; border-radius: 8px; padding: 8px 12px; font-size: 12px; line-height: 1.6; white-space: nowrap; pointer-events: none; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }'
        + '.dshp-tooltip-text { color: var(--dsw-alias-label-primary, #e1e3e6); }'
        + '.dshp-tooltip-text span { color: #4fc3f7; font-weight: 500; }'
        + '.dshp-months { display: flex; margin-top: 6px; font-size: 10px; color: var(--dsw-alias-label-secondary, #8b8d91); }'
        + '.dshp-month { flex: 1; text-align: left; overflow: visible; white-space: nowrap; font-size: 10px; }'
        + '.dshp-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }'
        + '.dshp-ov-item { background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); border-radius: 8px; padding: 12px 10px; text-align: center; }'
        + '.dshp-ov-num { font-size: 20px; font-weight: 700; color: var(--dsw-alias-label-primary, #e1e3e6); line-height: 1.2; }'
        + '.dshp-ov-lbl { font-size: 10px; color: var(--dsw-alias-label-secondary, #8b8d91); margin-top: 2px; }'
        + '.dshp-footer { margin-top: 16px; padding: 8px 12px; background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid var(--dsw-alias-border-l1, #2a2a2e); border-radius: 6px; font-size: 11px; color: var(--dsw-alias-label-secondary, #8b8d91); display: flex; gap: 16px; flex-wrap: wrap; }'
        + '.dshp-close { position: absolute; top: 18px; right: 4px; background: none; border: none; color: var(--dsw-alias-label-secondary, #8b8d91); font-size: 16px; cursor: pointer; padding: 2px 8px; border-radius: 4px; transition: all 0.15s; }'
        + '.dshp-close:hover { background: var(--dsw-alias-bg-layer-2, #26262a); color: var(--dsw-alias-label-primary, #e1e3e6); }'
        + '.dshp-file-input { display: none; }';
    }());

    // ===== 主页面组件 =====
    function ProfilePage(props) {
      var dataState = React.useState(null);
      var data = dataState[0];
      var setData = dataState[1];
      var loadingState = React.useState(true);
      var loading = loadingState[0];
      var setLoading = loadingState[1];

      var showEditState = React.useState(false);
      var showEdit = showEditState[0];
      var setShowEdit = showEditState[1];
      var editNameState = React.useState('');
      var editName = editNameState[0];
      var setEditName = editNameState[1];
      var editAvatarState = React.useState('');
      var editAvatar = editAvatarState[0];
      var setEditAvatar = editAvatarState[1];
      var editTierState = React.useState('');
      var editTier = editTierState[0];
      var setEditTier = editTierState[1];
      var savingState = React.useState(false);
      var saving = savingState[0];
      var setSaving = savingState[1];

      React.useEffect(function() {
        host.call('profile-stats', {}).then(function(result) {
          setData(result);
          setLoading(false);
        }).catch(function(err) {
          console.error('Failed to load profile:', err);
          setLoading(false);
        });
      }, []);

      function openEdit() {
        if (!data) return;
        setEditName(data.profile.name);
        setEditAvatar(data.profile.avatar || '');
        setEditTier(data.profile.tier || 'Plus');
        setShowEdit(true);
      }

      function saveEdit() {
        if (!editName.trim()) return;
        setSaving(true);
        host.call('save-profile', { name: editName.trim(), avatar: editAvatar || null, tier: editTier.trim() || 'Plus' }).then(function(result) {
          setSaving(false);
          if (result.ok) {
            setShowEdit(false);
            var newData = JSON.parse(JSON.stringify(data));
            newData.profile.name = editName.trim();
            newData.profile.avatar = editAvatar || null;
            newData.profile.tier = editTier.trim() || 'Plus';
            setData(newData);
          }
        }).catch(function(err) {
          console.error('Save failed:', err);
          setSaving(false);
        });
      }

      function handleAvatarFile(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { setEditAvatar(ev.target.result); };
        reader.readAsDataURL(file);
      }

      if (loading) {
        return React.createElement('div', { className: 'dshp' }, React.createElement('p', { style: { textAlign: 'center', padding: '60px 0', color: 'var(--dsw-alias-label-secondary, #8b8d91)', fontSize: '13px' } }, '加载中...'));
      }
      if (!data) {
        return React.createElement('div', { className: 'dshp' }, React.createElement('p', { style: { textAlign: 'center', padding: '60px 0', color: 'var(--dsw-alias-label-secondary, #8b8d91)' } }, '无法加载数据'));
      }

      var avatarContent = data.profile.avatar ? React.createElement('img', { src: data.profile.avatar, alt: 'avatar' }) : 'D';

      return React.createElement('div', { className: 'dshp' },
        React.createElement('button', { className: 'dshp-close', onClick: props.close }, '\u2715'),
        React.createElement('div', { className: 'dshp-header' },
          React.createElement('div', { className: 'dshp-avatar-wrap', onClick: openEdit },
            React.createElement('div', { className: 'dshp-avatar' }, avatarContent),
            React.createElement('div', { className: 'dshp-avatar-overlay' }, '\u7f16\u8f91'),
          ),
          React.createElement('div', { className: 'dshp-info' },
            React.createElement('h2', { onClick: openEdit }, data.profile.name),
            React.createElement('p', { className: 'dshp-handle' }, '@' + data.profile.name.toLowerCase().replace(/\s+/g, '')),
            React.createElement('span', { className: 'dshp-badge', onClick: openEdit }, data.profile.tier + ' \u00b7 DeepSeek Harness'),
          )
        ),
        React.createElement('div', { className: 'dshp-stats' },
          React.createElement(Stat, { value: data.stats.totalTokens, label: '\u7d2f\u8ba1 Token \u6570' }),
          React.createElement(Stat, { value: data.stats.peakTokens, label: '\u5cf0\u503c Token \u6570' }),
          React.createElement(Stat, { value: data.stats.longestChat, label: '\u6700\u957f\u804a\u5929\u65f6\u957f' }),
          React.createElement(Stat, { value: data.stats.currentStreak, label: '\u5f53\u524d\u8fde\u7eed\u5929\u6570' }),
          React.createElement(Stat, { value: data.stats.longestStreak, label: '\u6700\u957f\u8fde\u7eed\u5929\u6570' }),
        ),
        React.createElement('div', { className: 'dshp-overview' },
          React.createElement(OverviewItem, { num: data.overview.workspaces, label: '\u5de5\u4f5c\u533a' }),
          React.createElement(OverviewItem, { num: data.overview.sessions, label: '\u4f1a\u8bdd\u603b\u6570' }),
          React.createElement(OverviewItem, { num: data.overview.plugins, label: '\u5df2\u52a0\u8f7d\u7684\u63d2\u4ef6' }),
          React.createElement(OverviewItem, { num: data.overview.agents, label: '\u6d3b\u8dc3 Agent' }),
        ),
        React.createElement('div', { className: 'dshp-section' },
          React.createElement('h3', { className: 'dshp-h3' }, 'Token \u6d3b\u52a8', React.createElement('span', { className: 'dshp-sub' }, '(' + String(data.overview.sessions) + ' \u4e2a\u4f1a\u8bdd)')),
          React.createElement('div', { className: 'dshp-heatmap-wrap' },
            React.createElement(Heatmap, { rows: data.tokenActivity.heatmapRows, months: data.tokenActivity.months, dayData: data.tokenActivity.dayData, lastWeekDays: data.tokenActivity.lastWeekDays })
          ),
        ),
        React.createElement('div', { className: 'dshp-footer' },
          React.createElement('span', null, '\u5de5\u4f5c\u533a: ' + String(data.overview.workspaces)),
          React.createElement('span', null, '\u6d3b\u8dc3Agent: ' + String(data.overview.agents)),
          React.createElement('span', null, '\u4f1a\u8bdd: ' + String(data.overview.sessions)),
          React.createElement('span', null, '\u63d2\u4ef6: ' + String(data.overview.plugins)),
        ),
        // 编辑弹窗
        showEdit ? React.createElement('div', { className: 'dshp-modal', onClick: function(e) { if (e.target === e.currentTarget) setShowEdit(false); } },
          React.createElement('div', { className: 'dshp-modal-box' },
            React.createElement('h3', null, '\u7f16\u8f91\u4e2a\u4eba\u8d44\u6599'),
            React.createElement('label', null, '\u5934\u50cf'),
            React.createElement('input', { className: 'dshp-file-input', type: 'file', accept: 'image/*', id: 'dshp-avatar-upload', onChange: handleAvatarFile }),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } },
              React.createElement('div', { style: { width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', background: 'linear-gradient(135deg, #4fc3f7, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 } },
                editAvatar ? React.createElement('img', { src: editAvatar, style: { width: '100%', height: '100%', objectFit: 'cover' } }) : (editName ? editName[0].toUpperCase() : 'D')
              ),
              React.createElement('button', { className: 'dshp-modal-btn secondary', onClick: function() { document.getElementById('dshp-avatar-upload').click(); } }, '\u4e0a\u4f20\u56fe\u7247'),
              editAvatar ? React.createElement('button', { className: 'dshp-modal-btn secondary', onClick: function() { setEditAvatar(''); } }, '\u6e05\u9664') : null,
            ),
            React.createElement('label', null, '\u540d\u79f0'),
            React.createElement('input', { type: 'text', value: editName, onChange: function(e) { setEditName(e.target.value); }, placeholder: '\u8f93\u5165\u540d\u79f0' }),
            React.createElement('label', null, '\u8eab\u4efd\u6807\u8bc6'),
            React.createElement('input', { type: 'text', value: editTier, onChange: function(e) { setEditTier(e.target.value); }, placeholder: '\u5982 Plus, Pro, \u81ea\u5b9a\u4e49' }),
            React.createElement('div', { className: 'dshp-modal-actions' },
              React.createElement('button', { className: 'dshp-modal-btn secondary', onClick: function() { setShowEdit(false); } }, '\u53d6\u6d88'),
              React.createElement('button', { className: 'dshp-modal-btn primary', onClick: saveEdit, disabled: saving }, saving ? '\u4fdd\u5b58\u4e2d...' : '\u4fdd\u5b58'),
            ),
          )
        ) : null,
      );
    }

    function Stat(props) { return React.createElement('div', { className: 'dshp-stat' }, React.createElement('div', { className: 'dshp-stat-val' }, props.value), React.createElement('div', { className: 'dshp-stat-lbl' }, props.label)); }
    function OverviewItem(props) { return React.createElement('div', { className: 'dshp-ov-item' }, React.createElement('div', { className: 'dshp-ov-num' }, String(props.num)), React.createElement('div', { className: 'dshp-ov-lbl' }, props.label)); }

    function Heatmap(props) {
      var tooltipState = React.useState(null);
      var tooltip = tooltipState[0];
      var setTooltip = tooltipState[1];

      var numCols = props.rows.length > 0 ? props.rows[0].length : 0;
      var lastWeekDays = props.lastWeekDays || 7;

      var weekCols = [];
      for (var wk = 0; wk < numCols; wk++) {
        var maxDay = (wk === numCols - 1) ? lastWeekDays : 7;
        var col = [];
        for (var day = 0; day < maxDay; day++) {
          col.push(props.rows[day][wk]);
        }
        weekCols.push(col);
      }

      function handleMouseEnter(wi, di, e) {
        var idx = wi * 7 + di;
        var dayInfo = props.dayData && props.dayData[idx];
        if (!dayInfo || dayInfo.tokens === 0) { setTooltip(null); return; }
        var rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ x: rect.left + 16, y: rect.top - 8, month: dayInfo.month, day: dayInfo.day, tokens: dayInfo.tokens });
      }
      function handleMouseLeave() { setTooltip(null); }

      return React.createElement('div', { className: 'dshp-heatmap-inner' },
        React.createElement('div', null,
          React.createElement('div', { className: 'dshp-grid' },
            weekCols.map(function(week, wi) {
              return React.createElement('div', { className: 'dshp-col', key: wi },
                week.map(function(level, di) {
                  var cls = 'dshp-cell';
                  if (level > 0) cls += ' l' + level;
                  return React.createElement('div', { className: cls, key: di, onMouseEnter: function(e) { handleMouseEnter(wi, di, e); }, onMouseLeave: handleMouseLeave });
                })
              );
            })
          ),
          React.createElement('div', { className: 'dshp-months' }, props.months.map(function(m, i) { return React.createElement('span', { className: 'dshp-month', key: i }, m); }))
        ),
        tooltip ? React.createElement('div', { className: 'dshp-tooltip', style: { left: tooltip.x + 'px', top: tooltip.y + 'px' } },
          React.createElement('div', { className: 'dshp-tooltip-text' }, '\u4f60\u5728 ', React.createElement('span', null, tooltip.month + ' ' + tooltip.day), ' \u7528\u4e86 ', React.createElement('span', null, tooltip.tokens), ' Token')
        ) : null
      );
    }

    // ===== 注册到设置面板 =====
    slots.inject('settings.section', function() {
      return slots.register(
        { name: 'settings.section', id: 'dsh-profile', order: 5, label: '\u4e2a\u4eba\u4e3b\u9875' },
        function(props) { return React.createElement('div', { style: { position: 'relative' } }, React.createElement(ProfilePage, { close: props.close })); }
      );
    });
  },
};