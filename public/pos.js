let cart = [];
let allProducts = [];
let currentCategory = 'all';
let paymentMethod = null;

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadCategoriesPOS();
    await loadProductsPOS();
    renderCart();

    const cashInput = document.getElementById('cash-received');
    if (cashInput) {
        cashInput.addEventListener('input', calculateChange);
    }
});

async function loadCategoriesPOS() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const categories = await res.json();
        const list = document.getElementById('category-list');

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = cat.name;
            btn.onclick = () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterProducts(cat._id);
            };
            list.appendChild(btn);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadProductsPOS() {
    try {
        const res = await fetch(`${API_URL}/products`);
        allProducts = await res.json();
        renderProducts();
    } catch (err) {
        console.error(err);
    }
}

function filterProducts(catId) {
    currentCategory = catId;
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const filtered = currentCategory === 'all'
        ? allProducts
        : allProducts.filter(p => p.category && p.category._id === currentCategory);

    filtered.forEach(p => {
        const div = document.createElement('div');
        div.className = 'pos-product-card';
        div.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 0.5rem;">${p.name}</div>
            <div style="color: var(--primary-color);">$${p.price}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Stock: ${p.stock}</div>
        `;
        div.onclick = () => addToCart(p);
        grid.appendChild(div);
    });
}

function addToCart(product) {
    if (product.stock <= 0) {
        alert('Producto sin stock');
        return;
    }

    const existing = cart.find(i => i.product === product._id);
    if (existing) {
        if (existing.quantity >= product.stock) {
            alert('No hay más stock disponible para este producto');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            product: product._id,
            productName: product.name, // Snapshot
            price: product.price,
            quantity: 1,
            maxStock: product.stock
        });
    }
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function updateQty(index, delta) {
    const item = cart[index];
    const newQty = item.quantity + delta;
    if (newQty > 0 && newQty <= item.maxStock) {
        item.quantity = newQty;
    } else if (newQty <= 0) {
        removeFromCart(index);
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">El carrito está vacío</p>';
        totalEl.textContent = '$0';
        return;
    }

    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div>
                <div style="font-weight: bold; font-size: 1.05rem; margin-bottom: 0.25rem;">${item.productName}</div>
                <div style="font-size: 0.9rem; color: var(--text-muted);">$${item.price} x ${item.quantity}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="qty-controls">
                    <button class="btn-qty" onclick="updateQty(${i}, -1)">-</button>
                    <span style="font-weight: bold; min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="btn-qty" onclick="updateQty(${i}, 1)">+</button>
                </div>
                <button onclick="removeFromCart(${i})" style="background: var(--error-color); color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">🗑️</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalEl.textContent = `$${total}`;
}

function setPaymentMethod(method) {
    paymentMethod = method;
    document.getElementById('btn-cash').classList.toggle('active', method === 'cash');
    document.getElementById('btn-card').classList.toggle('active', method === 'card');

    // Toggle Inline Section
    const cashSection = document.getElementById('cash-section');
    if (cashSection) {
        if (method === 'cash') {
            cashSection.classList.remove('hidden');
        } else {
            cashSection.classList.add('hidden');
        }
    }
}

// Initial Render
renderCart();

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

async function initiateCheckout() {
    if (cart.length === 0) return alert('El carrito está vacío');
    if (!paymentMethod) return alert('Por favor, selecciona un método de pago');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Validate Cash
    if (paymentMethod === 'cash') {
        const received = parseFloat(document.getElementById('cash-received').value) || 0;
        if (received < total) {
            alert('Monto insuficiente');
            return;
        }
    }

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                total: total,
                paymentMethod
            })
        });

        if (res.ok) {
            // Store sold items to check stock
            const soldItems = [...cart];

            cart = [];
            renderCart();

            // Reset Payment UI
            document.getElementById('cash-received').value = '';
            paymentMethod = null;
            document.getElementById('btn-cash').classList.remove('active');
            document.getElementById('btn-card').classList.remove('active');
            document.getElementById('cash-section').classList.add('hidden');

            openModal('success-modal'); // Show Success Modal

            // Reload stock and Check for Low Stock
            await loadProductsPOS();

            checkLowStock(soldItems);
        } else {
            const err = await res.json();
            alert(`Error: ${err.message}`);
        }
    } catch (error) {
        console.error(error);
        alert('Error de red');
    }
}

function clearCart() {
    if (cart.length > 0 && confirm('¿Vaciar carrito?')) {
        cart = [];
        renderCart();
    }
}

// Ensure calculateChange works with new DOM
function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const received = parseFloat(document.getElementById('cash-received').value) || 0;
    const change = received - total;
    const changeEl = document.getElementById('cash-change');

    if (change >= 0) {
        changeEl.textContent = `$${change}`;
        changeEl.style.color = 'var(--primary-color)';
    } else {
        changeEl.textContent = 'Falta dinero';
        changeEl.style.color = 'var(--error-color)';
    }
}
// Re-bind listener
const cashInput = document.getElementById('cash-received');
if (cashInput) cashInput.addEventListener('input', calculateChange);

function checkLowStock(soldItems) {
    const warnings = [];

    soldItems.forEach(item => {
        // Find updated product in allProducts (which was just reloaded)
        const product = allProducts.find(p => p._id === item.product);
        // Use custom minStock or default to 5
        const threshold = product.minStock !== undefined ? product.minStock : 5;

        if (product && product.stock <= threshold) {
            warnings.push(`${product.name} (Queda: ${product.stock} / Mín: ${threshold})`);
        }
    });

    if (warnings.length > 0) {
        const list = document.getElementById('low-stock-list');
        list.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');

        // Show after success modal (could stack them or wait)
        // Simple approach: stack on top
        openModal('low-stock-modal');
    }
}

