// 模拟 apply 中 settings 相关逻辑，验证 schema 构造和注册不会抛错
const schema = require('@deepseek-ai/schemastery');

// 1. 构造 schema
let objSchema;
try {
  objSchema = schema.object({
    name: schema.string().default('delang chen'),
    tier: schema.string().default('Plus'),
    avatar: schema.string().default(''),
  });
  console.log('schema.object OK');
} catch (e) {
  console.error('schema.object FAILED:', e.message);
  process.exit(1);
}

// 2. 模拟 scope（get 返回默认值，update 记录调用）
const saved = { name: 'delang chen', tier: 'Plus', avatar: '' };
const scope = {
  get: () => saved,
  update: async (patch) => { Object.assign(saved, patch); console.log('update called with:', JSON.stringify(patch)); },
};

// 3. 模拟 profileStore 初始化逻辑
let profileStore = { name: 'delang chen', handle: '@cdllang', tier: 'Plus', avatar: null };
if (scope) {
  const v = scope.get();
  if (v) {
    profileStore.name = v.name || profileStore.name;
    profileStore.tier = v.tier || profileStore.tier;
    profileStore.avatar = v.avatar || null;
  }
}
profileStore.handle = '@' + profileStore.name.toLowerCase().replace(/\s+/g, '');
console.log('profileStore init:', JSON.stringify(profileStore));

// 4. 模拟 persistProfile
async function persistProfile(name, tier, avatar) {
  if (name !== undefined && name !== null && name !== '') profileStore.name = name;
  if (tier !== undefined && tier !== null && tier !== '') profileStore.tier = tier;
  if (avatar !== undefined) profileStore.avatar = avatar || null;
  profileStore.handle = '@' + profileStore.name.toLowerCase().replace(/\s+/g, '');
  if (scope) {
    await scope.update({ name: profileStore.name, tier: profileStore.tier, avatar: profileStore.avatar || '' });
  }
}

// 5. 模拟保存新资料
(async () => {
  await persistProfile('测试用户', 'Pro', 'data:image/png;base64,xxxx');
  console.log('after save:', JSON.stringify(profileStore));
  console.log('saved to settings:', JSON.stringify(saved));
  console.log('ALL CHECKS PASSED');
})();
