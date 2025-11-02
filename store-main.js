// Script principal da loja
class StoreMain {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.checkLocationPermission();
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
                    { id: 1, name: 'Produto Exemplo 1', price: 29.99, image: '' },
                    { id: 2, name: 'Produto Exemplo 2', price: 49.99, image: '' }
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
            <div class="product-card card">
                <div class="product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}">` : 
                        '<span>Imagem do Produto</span>'
                    }
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                    <button class="btn btn-primary buy-btn" data-id="${product.id}">
                        Comprar Agora
                    </button>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners aos botões
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                this.handlePurchase(productId);
            });
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.authSystem.logout();
            });
        }

        // Navegação
        document.getElementById('nav-home')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHome();
        });

        document.getElementById('nav-products')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showProducts();
        });
    }

    // Manipular compra
    async handlePurchase(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        // Obter localização
        const location = await this.getUserLocation();
        
        // Dados da compra
        const purchaseData = {
            productId: product.id,
            productName: product.name,
            price: product.price,
            customer: window.authSystem.currentUser?.username,
            location: location,
            timestamp: new Date().toISOString(),
            orderId: 'ORD' + Date.now()
        };

        // Enviar via WebRTC
        window.webrtcManager.sendData({
            type: 'purchase',
            payload: purchaseData
        });

        // Mostrar página de sucesso
        this.showSuccessPage(purchaseData);
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
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.error('Erro ao obter localização:', error);
                    resolve(null);
                },
                { timeout: 10000 }
            );
        });
    }

    // Verificar permissão de localização
    checkLocationPermission() {
        // Esta função pode ser usada para solicitar permissão antecipada
        console.log('Verificando permissão de localização...');
    }

    // Mostrar página de sucesso
    showSuccessPage(orderData) {
        // Criar modal de sucesso
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 20px;">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; color: var(--success-color); margin-bottom: 20px;">✓</div>
                    <h2>Compra Realizada com Sucesso!</h2>
                    <p>Seu pedido <strong>${orderData.orderId}</strong> foi processado.</p>
                    <p>Obrigado pela compra, ${orderData.customer}!</p>
                    <button class="btn btn-primary" style="margin-top: 20px;">Continuar Comprando</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fechar modal
        modal.querySelector('button').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showHome() {
        // Implementar página inicial
        console.log('Mostrando página inicial');
    }

    showProducts() {
        // Implementar lista de produtos
        console.log('Mostrando produtos');
    }
}

// Inicializar loja quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.storeMain = new StoreMain();
});

// Função global para atualizar produtos (usada pelo WebRTC)
window.updateProducts = function(products) {
    if (window.storeMain) {
        window.storeMain.products = products;
        window.storeMain.renderProducts();
    }
};