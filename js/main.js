// Fonctions principales pour la page d'accueil

// Variables globales
let currentUser = null;
let socket = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialiser Socket.IO si disponible
    if (typeof io !== 'undefined') {
        socket = io();
        setupSocketListeners();
    }
    
    // Définir la date actuelle pour les formulaires
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toTimeString().split(' ')[0].substring(0, 5);
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    
    dateInputs.forEach(input => {
        if (!input.value) input.value = today;
    });
    
    timeInputs.forEach(input => {
        if (!input.value) input.value = timeNow;
    });
}

function setupSocketListeners() {
    if (!socket) return;
    
    socket.on('meeting-created', (data) => {
        console.log('Nouvelle réunion créée:', data);
        showNotification('Réunion créée avec succès!', 'success');
    });
    
    socket.on('meeting-joined', (data) => {
        console.log('Réunion rejointe:', data);
        window.location.href = `meeting.html?room=${data.roomId}`;
    });
    
    socket.on('error', (error) => {
        console.error('Erreur:', error);
        showNotification(error.message || 'Une erreur est survenue', 'error');
    });
}

// Fonctions pour les modals
function showCreateMeeting() {
    const modal = document.getElementById('createMeetingModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        // Rediriger vers la page de création si le modal n'existe pas
        window.location.href = 'create-meeting.html';
    }
}

function showJoinMeeting() {
    const modal = document.getElementById('joinModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus sur le champ de saisie
        const input = document.getElementById('meetingCode');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Réinitialiser les formulaires
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Gestion des formulaires
function joinMeeting() {
    const meetingCode = document.getElementById('meetingCode')?.value?.trim();
    
    if (!meetingCode) {
        showNotification('Veuillez entrer un code de réunion', 'warning');
        return;
    }
    
    // Valider le format du code
    if (meetingCode.length < 3) {
        showNotification('Le code de réunion doit contenir au moins 3 caractères', 'warning');
        return;
    }
    
    // Simuler la connexion à la réunion
    showNotification('Connexion à la réunion...', 'info');
    
    if (socket) {
        socket.emit('join-meeting', { roomId: meetingCode });
    } else {
        // Fallback sans socket
        setTimeout(() => {
            window.location.href = `meeting.html?room=${meetingCode}`;
        }, 1000);
    }
}

// Gestion du formulaire de création de réunion
document.addEventListener('submit', function(e) {
    if (e.target.id === 'createMeetingForm') {
        e.preventDefault();
        handleCreateMeeting(e.target);
    }
});

function handleCreateMeeting(form) {
    const formData = new FormData(form);
    const meetingData = {
        title: formData.get('meetingTitle') || 'Nouvelle réunion',
        description: formData.get('meetingDescription') || '',
        date: formData.get('meetingDate'),
        time: formData.get('meetingTime'),
        duration: formData.get('meetingDuration') || 60,
        language: formData.get('meetingLanguage') || 'fr',
        requirePassword: document.getElementById('requirePassword')?.checked || false,
        password: formData.get('meetingPassword') || '',
        enableRecording: document.getElementById('enableRecording')?.checked || false,
        maxParticipants: document.getElementById('maxParticipants')?.value || 10
    };
    
    // Validation
    if (!meetingData.title.trim()) {
        showNotification('Le titre de la réunion est requis', 'warning');
        return;
    }
    
    if (meetingData.requirePassword && !meetingData.password) {
        showNotification('Veuillez définir un mot de passe', 'warning');
        return;
    }
    
    // Créer la réunion
    createMeeting(meetingData);
}

function createMeeting(meetingData) {
    showNotification('Création de la réunion...', 'info');
    
    if (socket) {
        socket.emit('create-meeting', meetingData);
    } else {
        // Fallback sans socket - générer un ID de réunion
        const roomId = generateRoomId();
        setTimeout(() => {
            showNotification('Réunion créée avec succès!', 'success');
            closeModal('createMeetingModal');
            setTimeout(() => {
                window.location.href = `meeting.html?room=${roomId}`;
            }, 1000);
        }, 1000);
    }
}

// Utilitaires
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Ajouter les styles si pas encore présents
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                padding: 15px 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            
            .notification-success { border-left: 4px solid #4CAF50; }
            .notification-error { border-left: 4px solid #f44336; }
            .notification-warning { border-left: 4px solid #FF9800; }
            .notification-info { border-left: 4px solid #2196F3; }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-content i {
                font-size: 16px;
            }
            
            .notification-success .notification-content i { color: #4CAF50; }
            .notification-error .notification-content i { color: #f44336; }
            .notification-warning .notification-content i { color: #FF9800; }
            .notification-info .notification-content i { color: #2196F3; }
            
            .notification-close {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                padding: 5px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Gestion des toggles
document.addEventListener('change', function(e) {
    if (e.target.id === 'requirePassword') {
        const passwordSection = document.getElementById('passwordSection');
        if (passwordSection) {
            passwordSection.style.display = e.target.checked ? 'block' : 'none';
        }
    }
    
    if (e.target.id === 'maxParticipants') {
        const valueDisplay = document.querySelector('.slider-value');
        if (valueDisplay) {
            valueDisplay.textContent = e.target.value;
        }
    }
});

// Gestion des touches
document.addEventListener('keydown', function(e) {
    // Fermer les modals avec Escape
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                closeModal(modal.id);
            }
        });
    }
    
    // Rejoindre une réunion avec Entrée
    if (e.key === 'Enter' && e.target.id === 'meetingCode') {
        e.preventDefault();
        joinMeeting();
    }
});

// Fonctions pour la navigation
function goToCreateMeeting() {
    window.location.href = 'create-meeting.html';
}

function goToHome() {
    window.location.href = 'index.html';
}

// Export des fonctions pour utilisation globale
window.showCreateMeeting = showCreateMeeting;
window.showJoinMeeting = showJoinMeeting;
window.closeModal = closeModal;
window.joinMeeting = joinMeeting;
window.createMeeting = createMeeting;
window.goToCreateMeeting = goToCreateMeeting;
window.goToHome = goToHome;
