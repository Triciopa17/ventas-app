let currentTab = 'products';
let currentId = null; // For editing
let categoriesCache = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') || 'products';
    switchTab(tab);
});

async function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Initial Load
    await loadData();
}

async function loadData() {
    const tbody = document.getElementById('table-body');
    const thead = document.getElementById('table-head');
    tbody.innerHTML = '<tr><td colspan="10">Cargando...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/${currentTab}`);
        const data = await res.json();

        // Also fetch categories if we are in products
        if (currentTab === 'products') {
            const catRes = await fetch(`${API_URL}/categories`);
            categoriesCache = await catRes.json();
        }

        renderTable(data, thead, tbody);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="10" style="color: red;">Error al cargar datos.</td></tr>';
    }
}

function renderTable(data, thead, tbody) {
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (currentTab === 'products') {
        thead.innerHTML = `<tr><th>Nombre</th><th>Precio</th><th>Stock</th><th>Min Stock</th><th>Categoría</th><th>Acciones</th></tr>`;
        data.forEach(item => {
            const catName = item.category ? item.category.name : 'Sin categoría';
            tbody.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>$${item.price}</td>
                    <td>${item.stock}</td>
                    <td>${item.minStock || 5}</td>
                    <td>${catName}</td>
                    <td class="actions">
                        <button class="btn-sm" onclick='editItem(${JSON.stringify(item)})'>Editar</button>
                        <button class="btn-sm btn-danger" onclick="deleteItem('${item._id}')">Eliminar</button>
                    </td>
                </tr>`;
        });
    } else if (currentTab === 'categories') {
        thead.innerHTML = `<tr><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>`;
        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.description || '-'}</td>
                    <td class="actions">
                        <button class="btn-sm" onclick='editItem(${JSON.stringify(item)})'>Editar</button>
                        <button class="btn-sm btn-danger" onclick="deleteItem('${item._id}')">Eliminar</button>
                    </td>
                </tr>`;
        });
    } else if (currentTab === 'users') {
        thead.innerHTML = `<tr><th>Usuario</th><th>Rol</th><th>Acciones</th></tr>`;
        data.forEach(item => {
            const roleName = item.role === 'admin' ? 'Administrador' : 'Vendedor';
            tbody.innerHTML += `
                <tr>
                    <td>${item.username}</td>
                    <td>${roleName}</td>
                    <td class="actions">
                        <button class="btn-sm" onclick='editItem(${JSON.stringify(item)})'>Editar</button>
                        <button class="btn-sm btn-danger" onclick="deleteItem('${item._id}')">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

// Modal & Forms
function openModal(item = null) {
    currentId = item ? item._id : null;
    document.getElementById('modal-title').textContent = item ? 'Editar Item' : 'Nuevo Item';
    document.getElementById('modal').classList.add('show');

    const fields = document.getElementById('modal-fields');
    fields.innerHTML = '';

    if (currentTab === 'products') {
        fields.innerHTML = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" name="name" value="${item?.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Precio</label>
                <input type="number" name="price" value="${item?.price || ''}" required>
            </div>
            <div class="form-group">
                <label>Stock</label>
                <input type="number" name="stock" value="${item?.stock || 0}" required>
            </div>
            <div class="form-group">
                <label>Stock Mínimo (Alerta)</label>
                <input type="number" name="minStock" value="${item?.minStock || 5}" required>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <select name="category" style="width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.2); color:white; border: 1px solid #334155; border-radius: 0.5rem;">
                    <option value="">Seleccionar...</option>
                    ${categoriesCache.map(c => `<option value="${c._id}" ${item?.category?._id === c._id || item?.category === c._id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <input type="text" name="description" value="${item?.description || ''}">
            </div>
        `;
    } else if (currentTab === 'categories') {
        fields.innerHTML = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" name="name" value="${item?.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <input type="text" name="description" value="${item?.description || ''}">
            </div>
        `;
    } else if (currentTab === 'users') {
        fields.innerHTML = `
            <div class="form-group">
                <label>Usuario</label>
                <input type="text" name="username" value="${item?.username || ''}" required>
            </div>
            <div class="form-group">
                <label>Rol</label>
                <select name="role" style="width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.2); color:white; border: 1px solid #334155; border-radius: 0.5rem;">
                    <option value="user" ${item?.role === 'user' ? 'selected' : ''}>Vendedor (Solo Ventas)</option>
                    <option value="admin" ${item?.role === 'admin' ? 'selected' : ''}>Administrador (Acceso Total)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Contraseña ${item ? '(Dejar en blanco para mantener)' : ''}</label>
                <input type="password" name="password" ${!item ? 'required' : ''}>
            </div>
        `;
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
    currentId = null;
}

function editItem(item) {
    if (currentTab === 'products' && (!categoriesCache || categoriesCache.length === 0)) {
        // Ensure categories are loaded before editing product
        fetch(`${API_URL}/categories`).then(r => r.json()).then(cats => {
            categoriesCache = cats;
            openModal(item);
        });
    } else {
        openModal(item);
    }
}

async function deleteItem(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
    try {
        const res = await fetch(`${API_URL}/${currentTab}/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
        else alert('Error al eliminar');
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const url = currentId
        ? `${API_URL}/${currentTab}/${currentId}`
        : `${API_URL}/${currentTab}`;

    const method = currentId ? 'PUT' : 'POST';

    // Cleanup empty strings
    if (data.category === "") delete data.category;
    if (data.password === "") delete data.password;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeModal();
            loadData();
        } else {
            const err = await res.json();
            alert('Error: ' + err.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
});
