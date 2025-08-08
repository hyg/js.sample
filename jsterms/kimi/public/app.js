const socket = io();
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => document.querySelectorAll(sel);

let store = null;

// 初始化
socket.emit('clientEvent', { event: 'sync' }); // 触发一次空事件，仅获取 store
socket.on('stateChanged', render);

// 菜单切换
qs('#tabTasks').onclick = () => switchTab('tasks');
qs('#tabPermissions').onclick = () => switchTab('permissions');
function switchTab(name) {
    qs('#tabTasks').classList.toggle('active', name === 'tasks');
    qs('#tabPermissions').classList.toggle('active', name === 'permissions');
    qs('#tasksPanel').classList.toggle('hidden', name !== 'tasks');
    qs('#permissionsPanel').classList.toggle('hidden', name !== 'permissions');
}

// 通用渲染
function render(data) {
    store = data;
    // 状态栏
    const header = qs('header');
    header.className = store.state.toLowerCase();
    qs('#currentStateBadge').textContent = store.state;

    // 任务
    qs('#taskList').innerHTML = store.tasks.map(t => `<li>${t}</li>`).join('');
    // 权限
    qs('#allowedList').innerHTML = store.allowed.map(p => `<li>${p}</li>`).join('');
    qs('#forbiddenList').innerHTML = store.forbidden.map(p => `<li>${p}</li>`).join('');

    // 系统事件按钮（动态读取 definition.events）
    fetch('/fsm-definition.json')
        .then(r => r.json())
        .then(def => {
            const container = qs('#eventButtons');
            container.innerHTML = '';
            Object.entries(def.events).forEach(([ev, meta]) => {
                if (meta.params) return; // 带参事件不在这里展示
                const btn = document.createElement('button');
                btn.textContent = ev;
                btn.className = 'eventBtn';
                btn.onclick = () => fireEvent(ev, {});
                container.appendChild(btn);
            });
            // 默认补充三条最常用事件
            ['userLogin', 'promoteToManager', 'userLogout'].forEach(ev => {
                if (!container.querySelector(`button[data-event="${ev}"]`)) {
                    const b = document.createElement('button');
                    b.textContent = ev; b.className = 'eventBtn';
                    b.onclick = () => fireEvent(ev, {});
                    container.appendChild(b);
                }
            });
        });
}

// 事件触发
function fireEvent(event, params = {}) {
    socket.emit('clientEvent', { event, params });
    const btn = event.target;
    if (btn) btn.classList.add('pulse');
    setTimeout(() => btn?.classList.remove('pulse'), 400);
}

// 事件绑定（带参）
qsa('[data-event]').forEach(btn => {
    btn.onclick = () => {
        const event = btn.dataset.event;
        const param = btn.dataset.param;
        fireEvent(event, param ? { [param]: param } : {});
    };
});

// 事件结果
socket.on('eventResult', res => {
    if (!res.ok) {
        alert(res.reason);
    }
});

// 底部日志
socket.on('stateChanged', () => {
    const log = qs('#eventLog');
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] state -> ${store.state}`;
    log.prepend(li);
});