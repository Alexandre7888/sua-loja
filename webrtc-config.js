// Configuração WebRTC para comunicação em tempo real
class WebRTCManager {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.isConnected = false;
    }

    // Inicializar conexão WebRTC
    async initialize() {
        try {
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            };

            this.peerConnection = new RTCPeerConnection(configuration);
            
            // Configurar canal de dados
            this.dataChannel = this.peerConnection.createDataChannel('storeData');
            this.setupDataChannel();
            
            // Configurar handlers de ICE
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Novo candidato ICE:', event.candidate);
                }
            };

            this.peerConnection.onconnectionstatechange = () => {
                console.log('Estado da conexão:', this.peerConnection.connectionState);
                this.isConnected = this.peerConnection.connectionState === 'connected';
            };

        } catch (error) {
            console.error('Erro ao inicializar WebRTC:', error);
        }
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Canal de dados aberto');
            this.isConnected = true;
        };

        this.dataChannel.onmessage = (event) => {
            this.handleIncomingData(JSON.parse(event.data));
        };

        this.dataChannel.onclose = () => {
            console.log('Canal de dados fechado');
            this.isConnected = false;
        };
    }

    // Enviar dados via WebRTC
    sendData(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
        }
    }

    handleIncomingData(data) {
        console.log('Dados recebidos:', data);
        // Processar dados recebidos conforme o tipo
        switch(data.type) {
            case 'product_update':
                this.handleProductUpdate(data.payload);
                break;
            case 'user_location':
                this.handleUserLocation(data.payload);
                break;
            case 'purchase_complete':
                this.handlePurchaseComplete(data.payload);
                break;
        }
    }

    handleProductUpdate(products) {
        // Atualizar lista de produtos na loja
        if (typeof window.updateProducts === 'function') {
            window.updateProducts(products);
        }
    }

    handleUserLocation(locationData) {
        // Salvar localização do usuário
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        userData.location = locationData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
    }

    handlePurchaseComplete(orderData) {
        // Processar compra concluída
        console.log('Compra concluída:', orderData);
        if (typeof window.showSuccessPage === 'function') {
            window.showSuccessPage(orderData);
        }
    }
}

// Inicializar WebRTC Manager global
window.webrtcManager = new WebRTCManager();
window.webrtcManager.initialize();