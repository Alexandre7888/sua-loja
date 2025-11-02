// Sistema de Autenticação com WebAuthn
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.checkAuthStatus();
    }

    // Verificar status de autenticação
    checkAuthStatus() {
        const userData = localStorage.getItem('currentUser');
        const adminAuth = localStorage.getItem('adminAuthenticated');
        
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.redirectToApp();
        } else {
            this.redirectToLogin();
        }

        this.isAdmin = adminAuth === 'true';
    }

    // Redirecionar para o aplicativo principal
    redirectToApp() {
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
    }

    // Redirecionar para login
    redirectToLogin() {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('admin.html')) {
            window.location.href = 'login.html';
        }
    }

    // Registrar novo usuário
    async registerUser(username, password, useBiometric = false) {
        try {
            const userData = {
                id: this.generateId(),
                username: username,
                password: this.hashPassword(password),
                device: navigator.userAgent,
                createdAt: new Date().toISOString(),
                location: null
            };

            if (useBiometric) {
                await this.registerBiometricCredential(userData.id);
            }

            // Salvar usuário
            const users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
            users.push(userData);
            localStorage.setItem('storeUsers', JSON.stringify(users));

            // Fazer login automaticamente
            await this.loginUser(username, password, useBiometric);

            return { success: true, user: userData };

        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, error: error.message };
        }
    }

    // Login de usuário
    async loginUser(username, password, useBiometric = false) {
        try {
            const users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
            const user = users.find(u => u.username === username);

            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            if (useBiometric) {
                await this.authenticateBiometric();
            } else {
                if (user.password !== this.hashPassword(password)) {
                    throw new Error('Senha incorreta');
                }
            }

            // Atualizar dados do usuário
            user.lastLogin = new Date().toISOString();
            user.device = navigator.userAgent;
            
            // Salvar usuário atual
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Atualizar lista de usuários
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            localStorage.setItem('storeUsers', JSON.stringify(updatedUsers));

            this.redirectToApp();
            return { success: true, user: user };

        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    // Registrar credencial biométrica
    async registerBiometricCredential(userId) {
        if (!window.PublicKeyCredential) {
            throw new Error('Navegador não suporta autenticação biométrica');
        }

        const publicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(32),
            rp: {
                name: "Minha Loja Online",
                id: window.location.hostname,
            },
            user: {
                id: new Uint8Array(16),
                name: userId,
                displayName: userId,
            },
            pubKeyCredParams: [{alg: -7, type: "public-key"}],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        // Salvar credencial
        const credentials = JSON.parse(localStorage.getItem('biometricCredentials') || '{}');
        credentials[userId] = credential;
        localStorage.setItem('biometricCredentials', JSON.stringify(credentials));
    }

    // Autenticar com biometria
    async authenticateBiometric() {
        const publicKeyCredentialRequestOptions = {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            timeout: 60000,
            userVerification: "required"
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        return assertion !== null;
    }

    // Login administrativo
    adminLogin(password) {
        const adminPassword = localStorage.getItem('adminPassword') || 'admin123';
        
        if (password === adminPassword) {
            localStorage.setItem('adminAuthenticated', 'true');
            this.isAdmin = true;
            return true;
        }
        return false;
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('adminAuthenticated');
        window.location.href = 'login.html';
    }

    // Utilitários
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    hashPassword(password) {
        // Hash simples - em produção use bcrypt
        return btoa(password);
    }
}

// Inicializar sistema de autenticação
window.authSystem = new AuthSystem();