# DSH 个人主页插件

DeepSeek Harness 的个人主页/仪表盘插件，显示您的使用统计、Token 活动热力图、会话数据等。

## 功能

- **个人资料** — 自定义头像、名称、身份标识
- **使用统计** — 累计 Token 数、峰值 Token 数、最长聊天时长、连续天数
- **概览面板** — 工作区、会话总数、已加载的插件、活跃 Agent
- **Token 活动热力图** — 35 周 Token 消耗分布，悬停查看每日详情
- **数据来源** — 所有数据来自 DSH 本地服务（`sessionProjections`、`sessionQuery` 等），无需联网

## 安装

### 方法一：通过 Cordis 动态插件安装（推荐，无需重启）

在 DSH 聊天中发送以下命令：

```
@dsh 安装插件 dsh-profile-plugin
```

或者手动通过 Cordis 加载：

```javascript
// 在 DSH 中运行
const plugin = {
  host: require('./src/host.js'),
  client: require('./src/client.js'),
};
```

### 方法二：作为 npm 包安装

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/dsh-profile-plugin.git
cd dsh-profile-plugin

# 安装依赖
npm install

# 在 DSH 配置中引用
```

### 方法三：直接复制代码

将 `src/host.js` 和 `src/client.js` 的内容复制到 DSH 的 Cordis 动态插件定义中即可。

## 使用

1. 安装插件后，打开 DSH 的**设置面板**（点击侧边栏底部的齿轮图标）
2. 在设置导航中可以看到 **"个人主页"** 条目
3. 点击即可查看仪表盘

### 自定义资料

- 点击头像或名称可以编辑个人资料
- 支持上传头像图片
- 可以自定义名称和身份标识（如 Plus、Pro 等）

## 数据说明

| 数据项 | 来源 |
|--------|------|
| Token 用量 | `sessionProjections.snapshot().values.tokenUsage` |
| 会话列表 | `sessionQuery.listSessions()` |
| 工作区 | `workspaceRegistry.list()` |
| 活跃 Agent | `agents.list()` |
| 已加载的插件 | `clientModules.graph().entries` |
| 事件时间分布 | `session.events[].time` |

## 截图

*（等待添加截图）*

## 开发

```bash
# 本地测试
npm run dev

# 构建
npm run build
```

## 许可

MIT