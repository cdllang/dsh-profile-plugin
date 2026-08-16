// 验证 client bundle 格式
const fs = require('fs');
const content = fs.readFileSync('D:/code/deepseekH/dsh/server/node_modules/dsh-profile/lib/client.js', 'utf8');
const idMatch = content.match(/id:\s*"([^"]+)"/);
console.log('client bundle id:', idMatch ? idMatch[1] : 'NOT FOUND');
console.log('has __ModuleLoader__.load:', content.includes('window.__ModuleLoader__.load'));
console.log('has require("react"):', content.includes('require("react")'));
console.log('has inject slots:', content.includes("inject: ['slots']") || content.includes('inject: ["slots"]'));
