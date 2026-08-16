// 验证 dsh-profile 包能否通过 clientModules 的 resolveMeta 检查
const { createRequire } = require('module');
const { readFileSync } = require('fs');
const { join, dirname } = require('path');
const { createHash } = require('crypto');

// 模拟 clientModules 的 parseDshClient
function parseDshClient(pkgName, value) {
  if (value === void 0) return void 0;
  if (typeof value !== 'object' || value === null) throw new Error('has a non-object dsh.client declaration');
  const decl = value;
  if (typeof decl.platform !== 'string') throw new Error('dsh.client.platform must be a string');
  if (decl.inject !== void 0 && (!Array.isArray(decl.inject) || decl.inject.some(i => typeof i !== 'string'))) throw new Error('dsh.client.inject must be a string array');
  if (decl.immediately !== void 0 && typeof decl.immediately !== 'boolean') throw new Error('dsh.client.immediately must be a boolean');
  return { platform: decl.platform, ...(decl.inject !== void 0 ? { inject: decl.inject } : {}), ...(decl.immediately !== void 0 ? { immediately: decl.immediately } : {}) };
}

// 模拟 clientModules 的 clientExportOf
function clientExportOf(pkgName, exportsField) {
  if (typeof exportsField !== 'object' || exportsField === null) return void 0;
  const client = exportsField['./client'];
  if (client === void 0) return void 0;
  if (typeof client === 'string') return client;
  throw new Error('exports["./client"] must be a string');
}

// baseUrl 模拟（DSH 配置树锚点）
const baseUrl = 'D:/code/deepseekH/dsh/server/node_modules/@deepseek-ai/dsh-base/cordis.patch.yml';
const require2 = createRequire(baseUrl);
let pkgPath;
try {
  pkgPath = require2.resolve('dsh-profile/package.json');
  console.log('pkgPath OK:', pkgPath);
} catch (e) {
  console.error('pkgPath FAILED:', e.message);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const decl = parseDshClient('dsh-profile', pkg.dsh ? pkg.dsh.client : void 0);
console.log('parseDshClient OK:', JSON.stringify(decl));
if (decl === void 0 || decl.platform !== 'web') {
  console.error('decl FAILED: platform not web');
  process.exit(1);
}
const clientRel = clientExportOf('dsh-profile', pkg.exports);
console.log('clientExportOf OK:', clientRel);
if (clientRel === void 0) {
  console.error('clientExportOf FAILED: no ./client export');
  process.exit(1);
}
const clientPath = join(dirname(pkgPath), clientRel);
const content = readFileSync(clientPath);
console.log('bundle read OK, size:', content.length);
const rev = createHash('sha1').update(content).digest('hex').slice(0, 12);
console.log('rev:', rev);
console.log('ALL CHECKS PASSED');
