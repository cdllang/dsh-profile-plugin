window.__ModuleLoader__.load({
	id: "dsh-profile",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		let react = require("react");

		// CSS
		const css = ".dshp{padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:var(--dsw-alias-label-primary,#e1e3e6);font-size:13px;line-height:1.5}.dshp *{box-sizing:border-box}.dshp-header{display:flex;align-items:center;gap:14px;padding:16px 0 20px 0;border-bottom:1px solid var(--dsw-alias-border-l1,#2a2a2e);margin-bottom:20px}.dshp-avatar-wrap{position:relative;flex-shrink:0;cursor:pointer}.dshp-avatar{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;overflow:hidden;background:linear-gradient(135deg,#4fc3f7,#0d47a1)}.dshp-avatar img{width:100%;height:100%;object-fit:cover}.dshp-avatar-overlay{position:absolute;inset:0;border-radius:10px;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;font-size:10px;color:#fff;pointer-events:none}.dshp-avatar-wrap:hover .dshp-avatar-overlay{opacity:1}.dshp-info{min-width:0;flex:1}.dshp-info h2{margin:0 0 1px 0;font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary,#e1e3e6);cursor:pointer}.dshp-info h2:hover{color:#4fc3f7}.dshp-info .dshp-handle{margin:0 0 4px 0;font-size:12px;color:var(--dsw-alias-label-secondary,#8b8d91)}.dshp-badge{display:inline-flex;align-items:center;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:500;background:var(--dsw-alias-bg-layer-2,#26262a);color:var(--dsw-alias-label-secondary,#8b8d91);border:1px solid var(--dsw-alias-border-l1,#2a2a2e);cursor:pointer}.dshp-badge:hover{color:#4fc3f7;border-color:#4fc3f7}.dshp-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6)}.dshp-modal-box{background:var(--dsw-alias-bg-layer-1,#1c1c1f);border:1px solid var(--dsw-alias-border-l1,#2a2a2e);border-radius:12px;padding:24px;width:340px}.dshp-modal h3{margin:0 0 16px 0;font-size:15px;font-weight:600}.dshp-modal label{display:block;font-size:12px;color:var(--dsw-alias-label-secondary,#8b8d91);margin-bottom:4px}.dshp-modal input{width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,#2a2a2e);background:var(--dsw-alias-bg-layer-2,#26262a);color:var(--dsw-alias-label-primary,#e1e3e6);font-size:13px;margin-bottom:12px;outline:none}.dshp-modal input:focus{border-color:#4fc3f7}.dshp-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}.dshp-modal-btn{padding:6px 16px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,#2a2a2e);font-size:12px;cursor:pointer;transition:all .15s}.dshp-modal-btn.primary{background:#4fc3f7;color:#000;border-color:#4fc3f7;font-weight:500}.dshp-modal-btn.primary:hover{background:#29b6f6}.dshp-modal-btn.secondary{background:transparent;color:var(--dsw-alias-label-secondary,#8b8d91)}.dshp-modal-btn.secondary:hover{background:var(--dsw-alias-bg-layer-2,#26262a)}.dshp-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px}.dshp-stat{background:var(--dsw-alias-bg-layer-1,#1c1c1f);border:1px solid var(--dsw-alias-border-l1,#2a2a2e);border-radius:8px;padding:12px 8px;text-align:center}.dshp-stat-val{font-size:17px;font-weight:700;line-height:1.3;color:var(--dsw-alias-label-primary,#e1e3e6);margin-bottom:2px}.dshp-stat-lbl{font-size:11px;line-height:1.3;color:var(--dsw-alias-label-secondary,#8b8d91)}.dshp-section{margin-bottom:20px}.dshp-h3{font-size:13px;font-weight:600;margin:0 0 10px 0;color:var(--dsw-alias-label-primary,#e1e3e6);display:flex;align-items:center;gap:6px}.dshp-h3 .dshp-sub{font-weight:400;font-size:11px;color:var(--dsw-alias-label-secondary,#8b8d91)}.dshp-heatmap-wrap{background:var(--dsw-alias-bg-layer-1,#1c1c1f);border:1px solid var(--dsw-alias-border-l1,#2a2a2e);border-radius:8px;padding:16px;overflow-x:auto;position:relative}.dshp-heatmap-inner{display:flex;flex-direction:row;align-items:flex-start}.dshp-grid{display:flex;flex-direction:row;gap:3px}.dshp-col{display:flex;flex-direction:column;gap:3px}.dshp-cell{width:12px;height:12px;border-radius:2px;background:var(--dsw-alias-bg-layer-2,#26262a);cursor:pointer}.dshp-cell.l1{background:#0d47a1}.dshp-cell.l2{background:#1565c0}.dshp-cell.l3{background:#1e88e5}.dshp-cell.l4{background:#42a5f5}.dshp-cell:hover{outline:1px solid #4fc3f7;outline-offset:1px}.dshp-tooltip{position:fixed;z-index:10000;background:#1c1c1f;border:1px solid #2a2a2e;border-radius:8px;padding:8px 12px;font-size:12px;line-height:1.6;white-space:nowrap;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.5)}.dshp-tooltip-text{color:var(--dsw-alias-label-primary,#e1e3e6)}.dshp-tooltip-text span{color:#4fc3f7;font-weight:500}.dshp-months{display:flex;margin-top:6px;font-size:10px;color:var(--dsw-alias-label-secondary,#8b8d91)}.dshp-month{flex:1;text-align:left;overflow:visible;white-space:nowrap;font-size:10px}.dshp-overview{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}.dshp-ov-item{background:var(--dsw-alias-bg-layer-1,#1c1c1f);border:1px solid var(--dsw-alias-border-l1,#2a2a2e);border-radius:8px;padding:12px 10px;text-align:center}.dshp-ov-num{font-size:20px;font-weight:700;color:var(--dsw-alias-label-primary,#e1e3e6);line-height:1.2}.dshp-ov-lbl{font-size:10px;color:var(--dsw-alias-label-secondary,#8b8d91);margin-top:2px}.dshp-footer{margin-top:16px;padding:8px 12px;background:var(--dsw-alias-bg-layer-1,#1c1c1f);border:1px solid var(--dsw-alias-border-l1,#2a2a2e);border-radius:6px;font-size:11px;color:var(--dsw-alias-label-secondary,#8b8d91);display:flex;gap:16px;flex-wrap:wrap}.dshp-close{position:absolute;top:18px;right:4px;background:none;border:none;color:var(--dsw-alias-label-secondary,#8b8d91);font-size:16px;cursor:pointer;padding:2px 8px;border-radius:4px;transition:all .15s}.dshp-close:hover{background:var(--dsw-alias-bg-layer-2,#26262a);color:var(--dsw-alias-label-primary,#e1e3e6)}.dshp-file-input{display:none}";
		const tagId = "dsh-profile/css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-profile";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		// Components
		function Stat(props) { return react.createElement('div',{className:'dshp-stat'},react.createElement('div',{className:'dshp-stat-val'},props.value),react.createElement('div',{className:'dshp-stat-lbl'},props.label)); }
		function OverviewItem(props) { return react.createElement('div',{className:'dshp-ov-item'},react.createElement('div',{className:'dshp-ov-num'},String(props.num)),react.createElement('div',{className:'dshp-ov-lbl'},props.label)); }

		function Heatmap(props) {
			var ts = react.useState(null), tooltip = ts[0], setTooltip = ts[1];
			var numCols = props.rows.length > 0 ? props.rows[0].length : 0;
			var lastWeekDays = props.lastWeekDays || 7;
			var weekCols = [];
			for (var wk = 0; wk < numCols; wk++) {
				var maxDay = (wk === numCols - 1) ? lastWeekDays : 7;
				var col = [];
				for (var day = 0; day < maxDay; day++) col.push(props.rows[day][wk]);
				weekCols.push(col);
			}
			function onEnter(wi, di, e) {
				var idx = wi * 7 + di;
				var info = props.dayData && props.dayData[idx];
				if (!info || (info.count === 0 && info.tokens === 0)) { setTooltip(null); return; }
				var rect = e.currentTarget.getBoundingClientRect();
				setTooltip({ x: rect.left + 16, y: rect.top - 8, month: info.month, day: info.day, count: info.count, tokens: info.tokens });
			}
			function onLeave() { setTooltip(null); }
			return react.createElement('div',{className:'dshp-heatmap-inner'},
				react.createElement('div',null,
					react.createElement('div',{className:'dshp-grid'},
						weekCols.map(function(week, wi) {
							return react.createElement('div',{className:'dshp-col',key:wi},
								week.map(function(level, di) {
									var cls = 'dshp-cell';
									if (level > 0) cls += ' l' + level;
									return react.createElement('div',{className:cls,key:di,onMouseEnter:function(e){onEnter(wi,di,e);},onMouseLeave:onLeave});
								})
							);
						})
					),
					react.createElement('div',{className:'dshp-months'},props.months.map(function(m,i){return react.createElement('span',{className:'dshp-month',key:i},m);}))
				),
				tooltip ? react.createElement('div',{className:'dshp-tooltip',style:{left:tooltip.x+'px',top:tooltip.y+'px'}},
					react.createElement('div',{className:'dshp-tooltip-text'},
						'你在 ',react.createElement('span',null,tooltip.month+' '+tooltip.day),' 用了 ',react.createElement('span',null,tooltip.tokens),' Token',
						' \u00b7 ',react.createElement('span',null,tooltip.count),' \u4e2a\u4f1a\u8bdd'
					)
				) : null
			);
		}

		function ProfilePage(props) {
			var ds = react.useState(null), data = ds[0], setData = ds[1];
			var ls = react.useState(true), loading = ls[0], setLoading = ls[1];
			var es = react.useState(false), showEdit = es[0], setShowEdit = es[1];
			var ns = react.useState(''), editName = ns[0], setEditName = ns[1];
			var avs = react.useState(''), editAvatar = avs[0], setEditAvatar = avs[1];
			var ts = react.useState(''), editTier = ts[0], setEditTier = ts[1];
			var ss = react.useState(false), saving = ss[0], setSaving = ss[1];

			react.useEffect(function() {
				fetch('/api/dsh-profile/stats').then(function(r){return r.json();}).then(function(result) {
					setData(result); setLoading(false);
				}).catch(function(err) {
					console.error('Failed to load profile:', err); setLoading(false);
				});
			}, []);

			function openEdit() {
				if (!data) return;
				setEditName(data.profile.name); setEditAvatar(data.profile.avatar || ''); setEditTier(data.profile.tier || 'Plus');
				setShowEdit(true);
			}
			function saveEdit() {
				if (!editName.trim()) return;
				setSaving(true);
				fetch('/api/dsh-profile/save', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:editName.trim(),avatar:editAvatar||null,tier:editTier.trim()||'Plus'})}).then(function(r){return r.json();}).then(function(result) {
					setSaving(false);
					if (result.ok) {
						setShowEdit(false);
						var nd = JSON.parse(JSON.stringify(data));
						nd.profile.name = editName.trim(); nd.profile.avatar = editAvatar || null; nd.profile.tier = editTier.trim() || 'Plus';
						setData(nd);
					}
				}).catch(function(err) { console.error('Save failed:', err); setSaving(false); });
			}
			function handleFile(e) {
				var file = e.target.files[0];
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function(ev) { setEditAvatar(ev.target.result); };
				reader.readAsDataURL(file);
			}

			if (loading) return react.createElement('div',{className:'dshp'},react.createElement('p',{style:{textAlign:'center',padding:'60px 0',color:'var(--dsw-alias-label-secondary, #8b8d91)',fontSize:'13px'}},'加载中...'));
			if (!data) return react.createElement('div',{className:'dshp'},react.createElement('p',{style:{textAlign:'center',padding:'60px 0',color:'var(--dsw-alias-label-secondary, #8b8d91)'}},'无法加载数据'));

			var avatarContent = data.profile.avatar ? react.createElement('img',{src:data.profile.avatar,alt:'avatar'}) : 'D';

			return react.createElement('div',{className:'dshp'},
				react.createElement('button',{className:'dshp-close',onClick:props.close},'\u2715'),
				react.createElement('div',{className:'dshp-header'},
					react.createElement('div',{className:'dshp-avatar-wrap',onClick:openEdit},
						react.createElement('div',{className:'dshp-avatar'},avatarContent),
						react.createElement('div',{className:'dshp-avatar-overlay'},'\u7f16\u8f91'),
					),
					react.createElement('div',{className:'dshp-info'},
						react.createElement('h2',{onClick:openEdit},data.profile.name),
						react.createElement('p',{className:'dshp-handle'},'@'+data.profile.name.toLowerCase().replace(/\s+/g,'')),
						react.createElement('span',{className:'dshp-badge',onClick:openEdit},data.profile.tier+' \u00b7 DeepSeek Harness'),
					)
				),
				react.createElement('div',{className:'dshp-stats'},
					react.createElement(Stat,{value:data.stats.totalTokens,label:'\u7d2f\u8ba1 Token \u6570'}),
					react.createElement(Stat,{value:data.stats.peakTokens,label:'\u5cf0\u503c Token \u6570'}),
					react.createElement(Stat,{value:data.stats.longestChat,label:'\u6700\u957f\u804a\u5929\u65f6\u957f'}),
					react.createElement(Stat,{value:data.stats.currentStreak,label:'\u5f53\u524d\u8fde\u7eed\u5929\u6570'}),
					react.createElement(Stat,{value:data.stats.longestStreak,label:'\u6700\u957f\u8fde\u7eed\u5929\u6570'}),
				),
				react.createElement('div',{className:'dshp-overview'},
					react.createElement(OverviewItem,{num:data.overview.workspaces,label:'\u5de5\u4f5c\u533a'}),
					react.createElement(OverviewItem,{num:data.overview.sessions,label:'\u4f1a\u8bdd\u603b\u6570'}),
					react.createElement(OverviewItem,{num:data.overview.plugins,label:'\u5df2\u52a0\u8f7d\u7684\u63d2\u4ef6'}),
					react.createElement(OverviewItem,{num:data.overview.agents,label:'\u6d3b\u8dc3 Agent'}),
				),
				react.createElement('div',{className:'dshp-section'},
					react.createElement('h3',{className:'dshp-h3'},'Token \u6d3b\u52a8',react.createElement('span',{className:'dshp-sub'},'('+String(data.overview.sessions)+' \u4e2a\u4f1a\u8bdd)')),
					react.createElement('div',{className:'dshp-heatmap-wrap'},
						react.createElement(Heatmap,{rows:data.tokenActivity.heatmapRows,months:data.tokenActivity.months,dayData:data.tokenActivity.dayData,lastWeekDays:data.tokenActivity.lastWeekDays})
					),
				),
				react.createElement('div',{className:'dshp-footer'},
					react.createElement('span',null,'\u5de5\u4f5c\u533a: '+String(data.overview.workspaces)),
					react.createElement('span',null,'\u6d3b\u8dc3Agent: '+String(data.overview.agents)),
					react.createElement('span',null,'\u4f1a\u8bdd: '+String(data.overview.sessions)),
					react.createElement('span',null,'\u63d2\u4ef6: '+String(data.overview.plugins)),
				),
				showEdit ? react.createElement('div',{className:'dshp-modal',onClick:function(e){if(e.target===e.currentTarget)setShowEdit(false);}},
					react.createElement('div',{className:'dshp-modal-box'},
						react.createElement('h3',null,'\u7f16\u8f91\u4e2a\u4eba\u8d44\u6599'),
						react.createElement('label',null,'\u5934\u50cf'),
						react.createElement('input',{className:'dshp-file-input',type:'file',accept:'image/*',id:'dshp-avatar-upload',onChange:handleFile}),
						react.createElement('div',{style:{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}},
							react.createElement('div',{style:{width:'48px',height:'48px',borderRadius:'10px',overflow:'hidden',background:'linear-gradient(135deg,#4fc3f7,#0d47a1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:700,color:'#fff',flexShrink:0}},
								editAvatar ? react.createElement('img',{src:editAvatar,style:{width:'100%',height:'100%',objectFit:'cover'}}) : (editName ? editName[0].toUpperCase() : 'D')
							),
							react.createElement('button',{className:'dshp-modal-btn secondary',onClick:function(){document.getElementById('dshp-avatar-upload').click();}},'\u4e0a\u4f20\u56fe\u7247'),
							editAvatar ? react.createElement('button',{className:'dshp-modal-btn secondary',onClick:function(){setEditAvatar('');}},'\u6e05\u9664') : null,
						),
						react.createElement('label',null,'\u540d\u79f0'),
						react.createElement('input',{type:'text',value:editName,onChange:function(e){setEditName(e.target.value);},placeholder:'\u8f93\u5165\u540d\u79f0'}),
						react.createElement('label',null,'\u8eab\u4efd\u6807\u8bc6'),
						react.createElement('input',{type:'text',value:editTier,onChange:function(e){setEditTier(e.target.value);},placeholder:'\u5982 Plus, Pro, \u81ea\u5b9a\u4e49'}),
						react.createElement('div',{className:'dshp-modal-actions'},
							react.createElement('button',{className:'dshp-modal-btn secondary',onClick:function(){setShowEdit(false);}},'\u53d6\u6d88'),
							react.createElement('button',{className:'dshp-modal-btn primary',onClick:saveEdit,disabled:saving},saving ? '\u4fdd\u5b58\u4e2d...' : '\u4fdd\u5b58'),
						),
					)
				) : null,
			);
		}

		module.exports = {
			inject: ['slots'],
			apply: function(ctx) {
				var slots = ctx.get('slots');
				if (slots === undefined) return;
				slots.inject('settings.section', function() {
					return slots.register(
						{ name: 'settings.section', id: 'dsh-profile', order: 5, label: '\u4e2a\u4eba\u4e3b\u9875' },
						function(props) { return react.createElement('div', { style: { position: 'relative' } }, react.createElement(ProfilePage, { close: props.close })); }
					);
				});
			}
		};
		return module.exports;
	}
});