// 用正确的 baseUrl（profile 目录）验证 dsh-profile 包解析
const { createRequire } = require('module');
const { readFileSync } = require('fs');
const { join, dirname } = require('path');
const { createHash } = require('crypto');

// 模拟 clientModules 的 resolvePkgJson（baseUrl = profile 目录）
const baseUrl = 'C:/Users/74432/.dsh/profiles/web/cordis.patch.yml';
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
console.log('dsh.client:', JSON.stringify(pkg.dsh ? pkg.dsh.client : 'MISSING'));
console.log('exports keys:', pkg.exports ? Object.keys(pkg.exports) : 'MISSING');

// 验证 host 插件可 require（用 dirname 而非 replace）
const host = require(dirname(pkgPath));
console.log('host require OK, inject:', JSON.stringify(host.inject));
console.log('apply type:', typeof host.apply);

// 验证 client bundle 存在
const clientRel = pkg.exports && pkg.exports['./client'];
const clientPath = join(dirname(pkgPath), clientRel);
const content = readFileSync(clientPath);
console.log('client bundle OK, size:', content.length);
const rev = createHash('sha1').update(content).digest('hex').slice(0, 12);
console.log('rev:', rev);
console.log('ALL CHECKS PASSED with profile baseUrl');
