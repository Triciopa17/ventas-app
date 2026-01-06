const API_URL = '/api';

// Login Handling
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-message');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.userId);
                localStorage.setItem('username', data.username);
                localStorage.setItem('role', data.role);

                if (data.role === 'admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'pos.html';
                }
            } else {
                errorMsg.textContent = 'Usuario o contraseña incorrectos';
                errorMsg.classList.remove('hidden');
            }
        } catch (error) {
            errorMsg.textContent = 'Error al conectar con el servidor';
            errorMsg.classList.remove('hidden');
        }
    });
}

// Authentication Check
function checkAuth() {
    const token = localStorage.getItem('token');
    const userDisplay = document.getElementById('user-display');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    if (userDisplay) {
        userDisplay.textContent = localStorage.getItem('username');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// Load Products
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">${product.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    <p class="price">$${product.price}</p>
                    <button onclick="buyProduct('${product._id}')" class="btn-secondary" style="width: auto;">Buy Now</button>
                </div>
            </div>
        `).join('');

        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No products found.</p>';
        }

    } catch (error) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--error-color);">Failed to load products.</p>';
    }
}

// Subscribe/Buy Action (Mockup)
async function buyProduct(productId) {
    if (!confirm('Proceed with purchase?')) return;

    try {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.ok) {
            alert('Purchase successful!');
        } else {
            alert('Purchase failed.');
        }
    } catch (error) {
        alert('Error processing purchase.');
    }
}
