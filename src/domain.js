(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LostFoundDomain = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TYPES = ['寻物', '招领'];
  const STATUSES = ['待处理', '已找到', '已归还'];

  function normalize(value) {
    return String(value == null ? '' : value).trim().toLowerCase();
  }

  function matches(item, keyword) {
    const q = normalize(keyword);
    if (!q) return true;
    return [item.title, item.category, item.place, item.description, item.type]
      .map(normalize)
      .some(text => text.includes(q));
  }

  function filterItems(items, keyword, type, status) {
    return items.filter(item =>
      matches(item, keyword) &&
      (!type || type === '全部' || item.type === type) &&
      (!status || status === '全部' || item.status === status)
    );
  }

  function validateItem(input) {
    const errors = {};
    if (!normalize(input.title)) errors.title = '请填写物品名称';
    if (!normalize(input.place)) errors.place = '请填写发现/遗失地点';
    if (!input.time) errors.time = '请选择发生时间';
    if (!normalize(input.description)) errors.description = '请填写详细描述';
    if (input.type && !TYPES.includes(input.type)) errors.type = '信息类型不正确';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function createItem(input, id, now) {
    return {
      id: id == null ? Date.now() : id,
      owner: input.owner || 'tan',
      type: input.type || '寻物',
      category: input.category || '其他',
      title: String(input.title || '').trim(),
      place: String(input.place || '').trim(),
      time: input.time,
      description: String(input.description || '').trim(),
      emoji: input.emoji || '📦',
      status: input.status || '待处理',
      createdAt: now || new Date().toISOString()
    };
  }

  function updateStatus(items, id, status) {
    if (!STATUSES.includes(status)) return items.slice();
    return items.map(item => item.id === id ? Object.assign({}, item, { status }) : item);
  }

  function updateItem(items, id, patch) {
    return items.map(item => item.id === id ? Object.assign({}, item, patch) : item);
  }

  function formatTime(value) {
    if (!value) return '';
    return String(value).replace('T', ' ').slice(0, 16);
  }

  function summarize(items) {
    return {
      total: items.length,
      pending: items.filter(item => item.status === '待处理').length,
      completed: items.filter(item => item.status === '已归还').length
    };
  }

  return { TYPES, STATUSES, normalize, matches, filterItems, validateItem, createItem, updateStatus, updateItem, formatTime, summarize };
}));
