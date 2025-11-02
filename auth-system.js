// Sistema de Autenticação com WebAuthn - CORRIGIDO
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.checkAuthStatus();
    }

    // Verificar status de autenticação - CORRIGIDO
    checkAuthStatus() {
        const userData = localStorage.getItem('currentUser');
        
        // Se não tem usuário logado E está na página principal, redireciona para login
        if (!userData && window.location.pathname.endsWith('index.html')) {
            this.redirectToLogin();
            return;
        }
        
        // Se tem usuário logado E está na página de login, redireciona para principal
        if (userData && window.location.pathname.endsWith('login.html')) {
            this.redirectToApp();
            return;
        }

        if (userData) {
            this.currentUser = JSON.parse(userData);
        }

        // Verificar admin
        this.isAdmin = localStorage.getItem('adminAuthenticated') === 'true';
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

    // Registrar novo usuário - CORRIGIDO
    async registerUser(username, password, useBiometric = false) {
        try {
            // Verificar se usuário já existe
            const users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
            const userExists = users.find(u => u.username === username);
            
            if (userExists) {
                throw new Error('Usuário já existe!');
            }

            const userData = {
                id: this.generateId(),
                username: username,
                password: this.hashPassword(password), // Em produção use bcrypt
                device: this.getDeviceInfo(),
                createdAt: new Date().toISOString(),
                lastLogin: null,
                location: null,
                biometricEnabled: useBiometric
            };

            // Tentar registrar biometria se solicitado
            if (useBiometric && this.supportsBiometric()) {
                try {
                    await this.registerBiometricCredential(userData.id);
                    userData.biometricRegistered = true;
                } catch (bioError) {
                    console.warn('Biometria não configurada:', bioError);
                    userData.biometricRegistered = false;
                }
            }

            // Salvar usuário
            users.push(userData);
            localStorage.setItem('storeUsers', JSON.stringify(users));

            // Fazer login automaticamente
            return await this.loginUser(username, password, useBiometric);

        } catch (error) {
            console.error('Erro no registro:', error);
            this.showNotification('❌ ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    // Login de usuário - CORRIGIDO
    async loginUser(username, password, useBiometric = false) {
        try {
            const users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
            const user = users.find(u => u.username === username);

            if (!user) {
                throw new Error('Usuário não encontrado!');
            }

            // Verificar método de autenticação
            if (useBiometric) {
                if (!user.biometricRegistered) {
                    throw new Error('Biometria não configurada para este usuário');
                }
                await this.authenticateBiometric();
            } else {
                // Verificar senha
                if (user.password !== this.hashPassword(password)) {
                    throw new Error('Senha incorreta!');
                }
            }

            // Atualizar dados do usuário
            user.lastLogin = new Date().toISOString();
            user.device = this.getDeviceInfo();
            
            // Salvar usuário atual
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Atualizar lista de usuários
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            localStorage.setItem('storeUsers', JSON.stringify(updatedUsers));

            this.showNotification('✅ Login realizado com sucesso!', 'success');
            
            // Redirecionar após breve delay
            setTimeout(() => {
                this.redirectToApp();
            }, 1000);

            return { success: true, user: user };

        } catch (error) {
            console.error('Erro no login:', error);
            this.showNotification('❌ ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    // Registrar credencial biométrica
    async registerBiometricCredential(userId) {
        if (!this.supportsBiometric()) {
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
            pubKeyCredParams: [
                {alg: -7, type: "public-key"},
                {alg: -257, type: "public-key"}
            ],
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

        return credential;
    }

    // Autenticar com biometria
    async authenticateBiometric() {
        if (!this.supportsBiometric()) {
            throw new Error('Biometria não suportada');
        }

        const publicKeyCredentialRequestOptions = {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            timeout: 60000,
            userVerification: "required"
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        if (!assertion) {
            throw new Error('Autenticação biométrica falhou');
        }

        return assertion;
    }

    // Login administrativo - CORRIGIDO
    adminLogin(password) {
        const adminPassword = localStorage.getItem('adminPassword') || 'admin123';
        
        if (password === adminPassword) {
            localStorage.setItem('adminAuthenticated', 'true');
            this.isAdmin = true;
            this.showNotification('✅ Acesso administrativo concedido!', 'success');
            
            // Redirecionar para admin após login
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
            
            return true;
        } else {
            this.showNotification('❌ Senha administrativa incorreta!', 'error');
            return false;
        }
    }

    // Verificar autenticação admin
    checkAdminAuth() {
        const isAdmin = localStorage.getItem('adminAuthenticated') === 'true';
        if (!isAdmin && window.location.pathname.includes('admin.html')) {
            const password = prompt('🔐 Senha de administrador:');
            if (!password || !this.adminLogin(password)) {
                window.location.href = 'login.html';
                return false;
            }
        }
        return true;
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('adminAuthenticated');
        this.showNotification('👋 Logout realizado com sucesso!', 'info');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    // Admin logout
    adminLogout() {
        localStorage.removeItem('adminAuthenticated');
        this.showNotification('👋 Logout administrativo realizado!', 'info');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    // Utilitários
    supportsBiometric() {
        return window.PublicKeyCredential && 
               PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
               PublicKeyCredential.isConditionalMediationAvailable;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    hashPassword(password) {
        // Hash simples - EM PRODUÇÃO USE BCRYPT!
        return btoa(unescape(encodeURIComponent(password)));
    }

    showNotification(message, type = 'info') {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Verificar se usuário está logado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }
}

// Inicializar sistema de autenticação
window.authSystem = new AuthSystem();