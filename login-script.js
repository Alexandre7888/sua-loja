// Script da página de login - CORRIGIDO
class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAutoRedirect();
    }

    // Verificar redirecionamento automático - CORRIGIDO
    checkAutoRedirect() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            console.log('Usuário já logado, redirecionando...');
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Link de registro
        const registerLink = document.getElementById('register-link');
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        // Acesso administrativo
        const adminAccess = document.getElementById('admin-access');
        if (adminAccess) {
            adminAccess.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAdminAccess();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const useBiometric = document.getElementById('biometric-login').checked;

        // Validações
        if (!username) {
            window.authSystem.showNotification('❌ Por favor, digite um nome de usuário', 'error');
            return;
        }

        if (!password && !useBiometric) {
            window.authSystem.showNotification('❌ Por favor, digite uma senha', 'error');
            return;
        }

        // Mostrar loading
        const submitBtn = document.querySelector('.login-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Entrando...';
        submitBtn.disabled = true;

        try {
            await window.authSystem.loginUser(username, password, useBiometric);
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async showRegisterForm() {
        const username = prompt('👤 Escolha um nome de usuário:');
        if (!username) return;

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            alert('❌ Nome de usuário inválido! Use apenas letras, números e underscore (3-20 caracteres)');
            return;
        }

        // Verificar se usuário já existe
        const users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
        const userExists = users.find(u => u.username === username);
        if (userExists) {
            alert('❌ Usuário já existe! Escolha outro nome.');
            return;
        }

        const password = prompt('🔒 Crie uma senha (mínimo 6 caracteres):');
        if (!password) return;

        if (password.length < 6) {
            alert('❌ A senha deve ter pelo menos 6 caracteres!');
            return;
        }

        const confirmPassword = prompt('🔒 Confirme a senha:');
        if (password !== confirmPassword) {
            alert('❌ Senhas não coincidem!');
            return;
        }

        const useBiometric = confirm('📱 Deseja configurar autenticação biométrica?\n\nIsso permitirá fazer login com digital/rosto no futuro.');

        // Mostrar loading no registro
        const registerLink = document.getElementById('register-link');
        const originalText = registerLink.textContent;
        registerLink.textContent = '⏳ Criando conta...';

        try {
            const result = await window.authSystem.registerUser(username, password, useBiometric);
            
            if (result.success) {
                window.authSystem.showNotification('✅ Conta criada com sucesso!', 'success');
            }
        } finally {
            registerLink.textContent = originalText;
        }
    }

    handleAdminAccess() {
        const password = prompt('🔐 Digite a senha de administrador:');
        if (password) {
            window.authSystem.adminLogin(password);
        }
    }
}

// Inicializar página de login
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar o authSystem estar pronto
    setTimeout(() => {
        window.loginPage = new LoginPage();
    }, 100);
});