const assert = require('node:assert/strict');
const D = require('../src/domain.js');

const base = { type: '寻物', category: '校园卡', title: '蓝色校园卡', place: '图书馆二楼', time: '2026-10-09T10:00', description: '蓝色卡套，背面有姓名贴纸。', status: '待处理' };
const items = [
  { ...base, id: 1 },
  { ...base, id: 2, type: '招领', title: '黑色雨伞', category: '其他', place: '食堂门口', status: '已找到' },
  { ...base, id: 3, title: '白色耳机', category: '电子设备', place: '体育馆西门', status: '已归还' }
];

const cases = [
  ['normalize trims and lowercases', () => assert.equal(D.normalize('  Campus Card '), 'campus card')],
  ['keyword matches title', () => assert.equal(D.filterItems(items, '耳机', '全部', '全部').length, 1)],
  ['keyword matches place and description', () => assert.equal(D.filterItems(items, '体育馆', '全部', '全部')[0].id, 3)],
  ['type filter keeps only lost items', () => assert.equal(D.filterItems(items, '', '寻物', '全部').length, 2)],
  ['status filter keeps completed item', () => assert.equal(D.filterItems(items, '', '全部', '已归还')[0].id, 3)],
  ['no result is empty', () => assert.equal(D.filterItems(items, '不存在', '全部', '全部').length, 0)],
  ['validation rejects missing required fields', () => assert.equal(D.validateItem({ type: '寻物' }).valid, false)],
  ['validation accepts complete input', () => assert.equal(D.validateItem(base).valid, true)],
  ['createItem applies defaults and owner', () => { const item = D.createItem({ title: '钥匙', place: '门口', time: base.time, description: '三把钥匙', owner: 'tan' }, 9, 'now'); assert.equal(item.id, 9); assert.equal(item.owner, 'tan'); assert.equal(item.status, '待处理'); }],
  ['updateStatus changes only target item', () => { const changed = D.updateStatus(items, 1, '已找到'); assert.equal(changed[0].status, '已找到'); assert.equal(changed[1].status, '已找到'); assert.equal(changed[2].status, '已归还'); }],
  ['updateItem changes editable fields', () => assert.equal(D.updateItem(items, 1, { title: '更新后的卡' })[0].title, '更新后的卡')],
  ['formatTime removes seconds and T', () => assert.equal(D.formatTime('2026-10-09T10:20:30'), '2026-10-09 10:20')],
  ['summary counts pending and returned', () => assert.deepEqual(D.summarize(items), { total: 3, pending: 1, completed: 1 })]
];

let passed = 0;
for (const [name, run] of cases) {
  try { run(); passed += 1; console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}\n  ${error.message}`); process.exitCode = 1; }
}
console.log(`\n${passed}/${cases.length} tests passed`);
if (passed !== cases.length) process.exitCode = 1;
