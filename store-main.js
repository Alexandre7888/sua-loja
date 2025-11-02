// Script principal da loja - CORRIGIDO
class StoreMain {
    constructor() {
        // VERIFICAÇÃO DE AUTENTICAÇÃO - CORRIGIDA
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            console.log('Usuário não logado, redirecionando para login...');
            window.location.href = 'login.html';
            return;
        }

        this.products = [];
        this.cart = JSON.parse(localStorage.getItem('userCart') || '[]');
        this.currentUser = JSON.parse(userData);
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.updateCartDisplay();
        this.displayWelcomeMessage();
    }

    // Mensagem de boas-vindas
    displayWelcomeMessage() {
        console.log(`👋 Bem-vindo, ${this.currentUser.username}!`);
    }

    // Carregar produtos
    async loadProducts() {
        try {
            const savedProducts = localStorage.getItem('storeProducts');
            if (savedProducts) {
                this.products = JSON.parse(savedProducts);
            } else {
                // Produtos padrão
                this.products = [
                    { 
                        id: 1, 
                        name: 'Smartphone Android', 
                        price: 899.99, 
                        image: '',
                        description: 'Smartphone Android com 128GB, câmera tripla e tela 6.5"'
                    },
                    { 
                        id: 2, 
                        name: 'Notebook Gamer', 
                        price: 2499.99, 
                        image: '',
                        description: 'Notebook gamer com RTX 3050, 16GB RAM e SSD 512GB'
                    },
                    { 
                        id: 3, 
                        name: 'Fone Bluetooth', 
                        price: 199.99, 
                        image: '',
                        description: 'Fone de ouvido Bluetooth com cancelamento de ruído'
                    },
                    { 
                        id: 4, 
                        name: 'Tablet 10"', 
                        price: 699.99, 
                        image: '',
                        description: 'Tablet 10 polegadas com 64GB e caneta stylus'
                    }
                ];
                localStorage.setItem('storeProducts', JSON.stringify(this.products));
            }
            
            this.renderProducts();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }

    // Renderizar produtos
    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        container.innerHTML = this.products.map(product => `
            <div class="product-card card fade-in">
                <div class="product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 
                        '<span>📱</span>'
                    }
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                    <button class="btn btn-primary buy-btn" data-id="${product.id}">
                        🛒 Comprar Agora
                    </button>
                    <button class="btn btn-outline add-cart-btn" data-id="${product.id}">
                        ➕ Carrinho
                    </button>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners
        this.attachProductEvents();
    }

    // Anexar eventos aos produtos
    attachProductEvents() {
        // Botões de compra
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                this.handlePurchase(productId);
            });
        });

        // Botões do carrinho
        document.querySelectorAll('.add-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                this.addToCart(productId);
            });
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja sair?')) {
                    window.authSystem.logout();
                }
            });
        }

        // Carrinho
        const cartLink = document.getElementById('nav-cart');
        if (cartLink) {
            cartLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCart();
            });
        }

        // Busca
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Modal do carrinho
        this.setupCartModal();
    }

    // Configurar modal do carrinho
    setupCartModal() {
        const modal = document.getElementById('cart-modal');
        const closeBtn = modal.querySelector('.close');
        const checkoutBtn = document.getElementById('checkout-btn');

        // Abrir modal
        document.getElementById('nav-cart').addEventListener('click', () => {
            modal.style.display = 'block';
            this.updateCartDisplay();
        });

        // Fechar modal
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Fechar ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Finalizar compra
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.handleCheckout();
            });
        }
    }

    // Adicionar ao carrinho
    addToCart(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        window.authSystem.showNotification('✅ Produto adicionado ao carrinho!', 'success');
    }

    // Salvar carrinho
    saveCart() {
        localStorage.setItem('userCart', JSON.stringify(this.cart));
    }

    // Atualizar display do carrinho
    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const cartItems = document.getElementById('cart-items');

        if (cartCount) {
            cartCount.textContent = this.cart.reduce((total, item) => total + item.quantity, 0);
        }

        if (cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = total.toFixed(2);
        }

        if (cartItems) {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div>
                        <strong>${item.name}</strong>
                        <div>R$ ${item.price.toFixed(2)} x ${item.quantity}</div>
                    </div>
                    <div>
                        <button class="btn btn-danger remove-cart-btn" data-id="${item.id}">🗑️</button>
                    </div>
                </div>
            `).join('');

            // Event listeners para remover itens
            document.querySelectorAll('.remove-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.removeFromCart(e.target.dataset.id);
                });
            });
        }
    }

    // Remover do carrinho
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id != productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    // Manipular compra
    async handlePurchase(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        if (confirm(`Deseja comprar "${product.name}" por R$ ${product.price.toFixed(2)}?`)) {
            // Obter localização
            const location = await this.getUserLocation();
            
            // Dados da compra
            const purchaseData = {
                orderId: 'ORD' + Date.now(),
                productId: product.id,
                productName: product.name,
                price: product.price,
                customer: this.currentUser.username,
                customerId: this.currentUser.id,
                location: location,
                timestamp: new Date().toISOString(),
                status: 'completed'
            };

            // Salvar pedido
            this.saveOrder(purchaseData);

            // Enviar via WebRTC
            if (window.webrtcManager && window.webrtcManager.isConnected) {
                window.webrtcManager.sendData({
                    type: 'purchase',
                    payload: purchaseData
                });
            }

            this.showSuccessPage(purchaseData);
        }
    }

    // Finalizar compra do carrinho
    async handleCheckout() {
        if (this.cart.length === 0) {
            alert('🛒 Seu carrinho está vazio!');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (confirm(`Finalizar compra de ${this.cart.length} itens por R$ ${total.toFixed(2)}?`)) {
            const location = await this.getUserLocation();
            
            const orderData = {
                orderId: 'ORD' + Date.now(),
                items: [...this.cart],
                total: total,
                customer: this.currentUser.username,
                customerId: this.currentUser.id,
                location: location,
                timestamp: new Date().toISOString(),
                status: 'completed'
            };

            // Salvar pedido
            this.saveOrder(orderData);

            // Limpar carrinho
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();

            // Fechar modal
            document.getElementById('cart-modal').style.display = 'none';

            this.showSuccessPage(orderData);
        }
    }

    // Salvar pedido
    saveOrder(orderData) {
        const orders = JSON.parse(localStorage.getItem('storeOrders') || '[]');
        orders.push(orderData);
        localStorage.setItem('storeOrders', JSON.stringify(orders));
    }

    // Obter localização do usuário
    async getUserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });
                },
                (error) => {
                    console.warn('Erro ao obter localização:', error);
                    resolve(null);
                },
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Filtrar produtos
    filterProducts(searchTerm) {
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredProducts(filteredProducts);
    }

    // Renderizar produtos filtrados
    renderFilteredProducts(filteredProducts) {
        const container = document.getElementById('products-container');
        if (!container) return;

        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px;">
                    <h3>🔍 Nenhum produto encontrado</h3>
                    <p>Tente usar outros termos de busca</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredProducts.map(product => `
            <div class="product-card card fade-in">
                <div class="product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 
                        '<span>📱</span>'
                    }
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                    <button class="btn btn-primary buy-btn" data-id="${product.id}">
                        🛒 Comprar Agora
                    </button>
                    <button class="btn btn-outline add-cart-btn" data-id="${product.id}">
                        ➕ Carrinho
                    </button>
                </div>
            </div>
        `).join('');

        this.attachProductEvents();
    }

    // Mostrar página de sucesso
    showSuccessPage(orderData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 20px; text-align: center;">
                <div style="font-size: 64px; color: var(--success-color); margin-bottom: 20px;">🎉</div>
                <h2>Compra Realizada com Sucesso!</h2>
                <p style="margin: 20px 0; font-size: 18px;">
                    Seu pedido <strong>${orderData.orderId}</strong> foi processado.
                </p>
                <p style="margin: 10px 0;">
                    <strong>Total: R$ ${orderData.total ? orderData.total.toFixed(2) : orderData.price.toFixed(2)}</strong>
                </p>
                <p>Obrigado pela compra, <strong>${orderData.customer}</strong>! 🎊</p>
                <button class="btn btn-primary" style="margin-top: 20px; padding: 12px 30px;">
                    👍 Continuar Comprando
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Fechar modal
        modal.querySelector('button').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
}

// Inicializar loja quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar o authSystem estar pronto
    setTimeout(() => {
        if (localStorage.getItem('currentUser')) {
            window.storeMain = new StoreMain();
        }
    }, 100);
});

// Função global para atualizar produtos (usada pelo WebRTC)
window.updateProducts = function(products) {
    if (window.storeMain) {
        window.storeMain.products = products;
        window.storeMain.renderProducts();
    }
};