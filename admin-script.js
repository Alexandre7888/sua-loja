// Script do painel administrativo
class AdminPanel {
    constructor() {
        this.checkAdminAuth();
        this.init();
    }

    // Verificar autenticação admin
    checkAdminAuth() {
        const isAdmin = localStorage.getItem('adminAuthenticated') === 'true';
        if (!isAdmin) {
            const password = prompt('Senha de administrador:');
            if (!window.authSystem.adminLogin(password)) {
                alert('Senha incorreta!');
                window.location.href = 'login.html';
                return;
            }
        }
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.setupTabs();
    }

    // Carregar dados
    async loadData() {
        this.loadProducts();
        this.loadUsers();
        this.loadSettings();
    }

    // Carregar produtos
    loadProducts() {
        const products = JSON.parse(localStorage.getItem('storeProducts') || '[]');
        const tbody = document.getElementById('admin-products-list');
        
        if (tbody) {
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>R$ ${product.price?.toFixed(2) || '0.00'}</td>
                    <td>
                        <button class="btn btn-outline edit-product" data-id="${product.id}">Editar</button>
                        <button class="btn btn-danger delete-product" data-id="${product.id}">Excluir</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Carregar usuários
    loadUsers() {
        const users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
        const tbody = document.getElementById('users-list');
        
        if (tbody) {
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.device || 'N/A'}</td>
                    <td>${user.location ? 
                        `${user.location.latitude.toFixed(4)}, ${user.location.longitude.toFixed(4)}` : 
                        'Não disponível'
                    }</td>
                </tr>
            `).join('');
        }
    }

    // Carregar configurações
    loadSettings() {
        const paymentUrl = localStorage.getItem('paymentUrl') || '';
        document.getElementById('payment-url').value = paymentUrl;
    }

    // Configurar abas
    setupTabs() {
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.dataset.tab;
                
                // Ativar aba
                document.querySelectorAll('[data-tab]').forEach(t => {
                    t.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Mostrar conteúdo
                document.querySelectorAll('.admin-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Adicionar produto
        document.getElementById('add-product-btn')?.addEventListener('click', () => {
            this.addProduct();
        });

        // Salvar configurações
        document.getElementById('save-payment-settings')?.addEventListener('click', () => {
            this.savePaymentSettings();
        });

        // Logout admin
        document.getElementById('admin-logout')?.addEventListener('click', () => {
            localStorage.removeItem('adminAuthenticated');
            window.location.href = 'login.html';
        });

        // Delegation para botões de produtos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-product')) {
                this.deleteProduct(e.target.dataset.id);
            }
            if (e.target.classList.contains('edit-product')) {
                this.editProduct(e.target.dataset.id);
            }
        });
    }

    // Adicionar produto
    addProduct() {
        const name = prompt('Nome do produto:');
        const price = parseFloat(prompt('Preço do produto:'));
        
        if (name && price) {
            const products = JSON.parse(localStorage.getItem('storeProducts') || '[]');
            const newProduct = {
                id: Date.now(),
                name: name,
                price: price,
                image: ''
            };
            
            products.push(newProduct);
            localStorage.setItem('storeProducts', JSON.stringify(products));
            
            // Enviar atualização via WebRTC
            window.webrtcManager.sendData({
                type: 'product_update',
                payload: products
            });
            
            this.loadProducts();
            alert('Produto adicionado com sucesso!');
        }
    }

    // Editar produto
    editProduct(productId) {
        const products = JSON.parse(localStorage.getItem('storeProducts') || '[]');
        const product = products.find(p => p.id == productId);
        
        if (product) {
            const newName = prompt('Novo nome:', product.name);
            const newPrice = parseFloat(prompt('Novo preço:', product.price));
            
            if (newName && newPrice) {
                product.name = newName;
                product.price = newPrice;
                
                localStorage.setItem('storeProducts', JSON.stringify(products));
                
                // Enviar atualização via WebRTC
                window.webrtcManager.sendData({
                    type: 'product_update',
                    payload: products
                });
                
                this.loadProducts();
                alert('Produto atualizado com sucesso!');
            }
        }
    }

    // Excluir produto
    deleteProduct(productId) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            const products = JSON.parse(localStorage.getItem('storeProducts') || '[]');
            const filteredProducts = products.filter(p => p.id != productId);
            
            localStorage.setItem('storeProducts', JSON.stringify(filteredProducts));
            
            // Enviar atualização via WebRTC
            window.webrtcManager.sendData({
                type: 'product_update',
                payload: filteredProducts
            });
            
            this.loadProducts();
            alert('Produto excluído com sucesso!');
        }
    }

    // Salvar configurações de pagamento
    savePaymentSettings() {
        const paymentUrl = document.getElementById('payment-url').value;
        localStorage.setItem('paymentUrl', paymentUrl);
        alert('Configurações salvas com sucesso!');
    }
}

// Inicializar painel admin
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});