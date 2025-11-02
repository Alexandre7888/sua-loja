// Script da página de login
class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulário de login
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Link de registro
        document.getElementById('register-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const useBiometric = document.getElementById('biometric-login').checked;

        const result = await window.authSystem.loginUser(username, password, useBiometric);
        
        if (!result.success) {
            alert('Erro no login: ' + result.error);
        }
    }

    showRegisterForm() {
        const username = prompt('Escolha um nome de usuário:');
        if (!username) return;

        const password = prompt('Crie uma senha:');
        if (!password) return;

        const useBiometric = confirm('Deseja usar autenticação biométrica?');

        window.authSystem.registerUser(username, password, useBiometric)
            .then(result => {
                if (result.success) {
                    alert('Registro realizado com sucesso!');
                } else {
                    alert('Erro no registro: ' + result.error);
                }
            });
    }
}

// Inicializar página de login
document.addEventListener('DOMContentLoaded', () => {
    window.loginPage = new LoginPage();
});