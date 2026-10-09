(function () {
  'use strict';
  const D = window.LostFoundDomain;
  const STORAGE_KEY = 'campus-lost-found-items-v2';
  const labels = { home: '首页', publish: '发布信息', search: '搜索物品', detail: '信息详情', mine: '我的发布', help: '使用帮助' };
  const state = { view: 'home', detailId: 1, editingId: null, mineStatus: '全部', items: loadItems() };
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function loadItems() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (_) { /* 使用种子数据继续演示 */ }
    return window.LostFoundSeed.map(item => Object.assign({ owner: item.id === 1 || item.id === 3 ? 'tan' : 'public' }, item));
  }

  function saveItems() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); }
  function ownItems() { return state.items.filter(item => item.owner === 'tan'); }
  function typeClass(item) { return item.type === '寻物' ? 'blue' : ''; }
  function statusClass(status) { return status === '已归还' ? 'gray' : status === '已找到' ? 'orange' : ''; }
  function displayTime(time) { return D.formatTime(time).replace(/^\d{4}-/, ''); }

  function card(item, mineMode) {
    const actions = mineMode ? `<div class="item-actions"><select data-action="status" data-id="${item.id}" aria-label="修改状态"><option ${item.status === '待处理' ? 'selected' : ''}>待处理</option><option ${item.status === '已找到' ? 'selected' : ''}>已找到</option><option ${item.status === '已归还' ? 'selected' : ''}>已归还</option></select><button class="ghost" data-action="edit" data-id="${item.id}">修改</button><button class="danger" data-action="delete" data-id="${item.id}">删除</button></div>` : '';
    return `<article class="card item"><div class="item-photo">${esc(item.emoji || '📦')}</div><div class="item-body"><div class="row"><div class="item-title">${esc(item.title)}</div><button class="ghost" data-action="detail" data-id="${item.id}">查看详情</button></div><div class="meta">${esc(item.place)} · ${esc(displayTime(item.time))}</div><span class="tag ${typeClass(item)}">${esc(item.type)}</span><span class="tag ${statusClass(item.status)}" style="margin-left:5px">${esc(item.status)}</span>${actions}</div></article>`;
  }

  function renderHome() {
    const summary = D.summarize(state.items);
    $('statTotal').textContent = summary.total;
    $('statDone').textContent = summary.completed;
    $('statPending').textContent = summary.pending;
    $('latestGrid').innerHTML = state.items.slice(0, 3).map(item => card(item, false)).join('');
  }

  function renderSearch() {
    const query = $('searchInput').value;
    const type = $('searchType').value;
    const result = D.filterItems(state.items, query, type, '全部');
    $('resultTitle').textContent = query ? `“${query}”的搜索结果` : '全部信息';
    $('resultCount').textContent = `共 ${result.length} 条`;
    $('resultGrid').innerHTML = result.length ? result.map(item => card(item, false)).join('') : '<div class="empty"><div class="big">⌕</div>没有找到匹配信息，请换个关键词再试试。</div>';
  }

  function renderMine() {
    const result = D.filterItems(ownItems(), '', '全部', state.mineStatus);
    $('mineGrid').innerHTML = result.length ? result.map(item => card(item, true)).join('') : '<div class="empty"><div class="big">□</div>当前筛选下没有发布记录。</div>';
    document.querySelectorAll('#mineTabs button').forEach(btn => btn.classList.toggle('active', btn.dataset.status === state.mineStatus));
  }

  function renderDetail() {
    const item = state.items.find(x => x.id === state.detailId) || state.items[0];
    if (!item) return;
    $('detailEmoji').textContent = item.emoji || '📦';
    $('detailTag').textContent = item.type;
    $('detailTag').className = `tag ${typeClass(item)}`;
    $('detailTitle').textContent = item.title;
    $('detailSub').textContent = `发布于 ${D.formatTime(item.time)}`;
    $('detailCategory').textContent = item.category;
    $('detailPlace').textContent = item.place;
    $('detailTime').textContent = D.formatTime(item.time);
    $('detailStatus').textContent = item.status;
    $('detailDescription').textContent = item.description;
    $('contactBox').hidden = true;
  }

  function render() { renderHome(); renderSearch(); renderMine(); renderDetail(); }

  function showView(view) {
    state.view = view;
    document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
    document.querySelectorAll('.nav button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    $('crumbText').textContent = labels[view];
    if (view === 'search') renderSearch();
    if (view === 'mine') renderMine();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearErrors() { document.querySelectorAll('[data-error]').forEach(node => { node.textContent = ''; }); }
  function fillForm(item) {
    $('type').value = item.type; $('category').value = item.category; $('title').value = item.title; $('place').value = item.place; $('time').value = item.time; $('description').value = item.description;
  }
  function resetForm() { state.editingId = null; $('publishHeading').textContent = '发布信息'; $('publishSubmit').textContent = '发布信息'; $('publishForm').reset(); $('time').value = '2026-09-28T15:30'; clearErrors(); }
  function editItem(id) { const item = state.items.find(x => x.id === id); if (!item) return; state.editingId = id; $('publishHeading').textContent = '修改信息'; $('publishSubmit').textContent = '保存修改'; fillForm(item); showView('publish'); }

  function submitForm(event) {
    event.preventDefault();
    const input = { type: $('type').value, category: $('category').value, title: $('title').value, place: $('place').value, time: $('time').value, description: $('description').value };
    const checked = D.validateItem(input); clearErrors();
    if (!checked.valid) { Object.keys(checked.errors).forEach(key => { const node = document.querySelector(`[data-error="${key}"]`); if (node) node.textContent = checked.errors[key]; }); toast('请补充必填信息'); return; }
    if (state.editingId != null) state.items = D.updateItem(state.items, state.editingId, input);
    else state.items = [D.createItem(Object.assign(input, { owner: 'tan', emoji: input.type === '寻物' ? '🔎' : '🤝' }), Date.now()), ...state.items];
    saveItems(); render(); toast(state.editingId != null ? '修改成功' : '发布成功'); resetForm(); showView('mine');
  }

  function handleAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const id = Number(target.dataset.id); const action = target.dataset.action;
    if (action === 'detail') { state.detailId = id; renderDetail(); showView('detail'); }
    if (action === 'edit') editItem(id);
    if (action === 'delete') { state.items = state.items.filter(item => item.id !== id); saveItems(); render(); toast('已删除这条发布'); }
    if (action === 'status') return;
  }

  function toast(message) { const node = $('toast'); node.textContent = message; node.classList.remove('show'); void node.offsetWidth; node.classList.add('show'); }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view]');
    if (nav) { if (nav.dataset.view === 'publish' && !state.editingId) resetForm(); showView(nav.dataset.view); }
    handleAction(event);
  });
  $('homeSearchBtn').addEventListener('click', () => { $('searchInput').value = $('homeSearch').value; $('searchType').value = $('homeType').value; showView('search'); });
  $('searchBtn').addEventListener('click', renderSearch);
  $('searchInput').addEventListener('keydown', event => { if (event.key === 'Enter') renderSearch(); });
  $('publishForm').addEventListener('submit', submitForm);
  document.addEventListener('change', event => {
    const target = event.target.closest('[data-action="status"]');
    if (!target) return;
    state.items = D.updateStatus(state.items, Number(target.dataset.id), target.value);
    saveItems(); render(); toast('状态已更新');
  });
  $('cancelPublish').addEventListener('click', () => { resetForm(); showView('home'); });
  $('contactBtn').addEventListener('click', () => { $('contactBox').hidden = false; toast('已展示联系方式'); });
  $('mineTabs').addEventListener('click', event => { const btn = event.target.closest('button[data-status]'); if (btn) { state.mineStatus = btn.dataset.status; renderMine(); } });
  render();
}());
