// JavaScript pour la page de rejoindre une réunion

// Variables globales
let socket = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeJoinPage();
});

function initializeJoinPage() {
    // Initialiser Socket.IO si disponible
    if (typeof io !== 'undefined') {
        socket = io();
        setupSocketListeners();
    }
    
    // Charger les réunions récentes depuis le localStorage
    loadRecentMeetings();
    
    // Charger l'historique de recherche
    loadSearchHistory();
    
    // Ajouter l'événement Enter sur le champ de saisie
    const meetingIdInput = document.getElementById('meetingId');
    if (meetingIdInput) {
        meetingIdInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                joinExistingMeeting();
            }
        });
        
        // Focus automatique sur le champ
        meetingIdInput.focus();
    }
}

function setupSocketListeners() {
    if (!socket) return;
    
    socket.on('meeting-joined', (data) => {
        console.log('Réunion rejointe:', data);
        // Sauvegarder dans l'historique
        saveToHistory(data.roomId);
        // Rediriger vers l'interface de réunion
        window.location.href = `meeting.html?room=${data.roomId}`;
    });
    
    socket.on('meeting-error', (error) => {
        console.error('Erreur réunion:', error);
        showNotification(error.message || 'Erreur lors de la connexion à la réunion', 'error');
    });
    
    socket.on('error', (error) => {
        console.error('Erreur:', error);
        showNotification(error.message || 'Une erreur est survenue', 'error');
    });
}

function joinExistingMeeting() {
    const meetingIdInput = document.getElementById('meetingId');
    const meetingId = meetingIdInput.value.trim();
    
    if (!meetingId) {
        showNotification('Veuillez entrer un code de réunion', 'error');
        meetingIdInput.focus();
        return;
    }
    
    // Validation du format du code de réunion
    if (meetingId.length < 3) {
        showNotification('Le code de réunion doit contenir au moins 3 caractères', 'error');
        return;
    }
    
    showNotification('Connexion à la réunion...', 'info');
    
    if (socket) {
        // Rejoindre via Socket.IO
        socket.emit('join-room', {
            roomId: meetingId,
            userInfo: {
                name: 'Utilisateur',
                id: generateUserId()
            }
        });
    } else {
        // Fallback : redirection directe
        setTimeout(() => {
            saveToHistory(meetingId);
            window.location.href = `meeting.html?room=${meetingId}`;
        }, 1000);
    }
}

function scanCode() {
    showNotification('Fonction de scan QR à venir...', 'info');
    // Ici on pourrait intégrer une bibliothèque de scan QR
    // comme QuaggaJS, ZXing ou utiliser l'API getUserMedia
    
    // Simulation d'un scan réussi pour la démo
    setTimeout(() => {
        const simulatedCode = 'demo-scan-' + Math.random().toString(36).substr(2, 6);
        document.getElementById('meetingId').value = simulatedCode;
        showNotification('Code QR scanné avec succès !', 'success');
    }, 2000);
}

function joinByInvitation() {
    showNotification('Fonction de rejoindre par invitation à venir...', 'info');
    // Ici on pourrait ouvrir un modal pour coller un lien d'invitation
    // ou intégrer avec des services de calendrier
}

function loadRecentMeetings() {
    try {
        const recentMeetings = JSON.parse(localStorage.getItem('recentMeetings') || '[]');
        
        if (recentMeetings.length > 0) {
            updateRecentMeetingsDisplay(recentMeetings);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des réunions récentes:', error);
    }
}

function updateRecentMeetingsDisplay(meetings) {
    const meetingCards = document.querySelector('.meeting-cards');
    if (!meetingCards || meetings.length === 0) return;
    
    meetingCards.innerHTML = '';
    
    meetings.slice(0, 3).forEach((meeting, index) => {
        const iconClasses = ['green', 'blue', 'orange'];
        const icons = ['fas fa-users', 'fas fa-presentation', 'fas fa-briefcase'];
        
        const card = document.createElement('div');
        card.className = 'meeting-card';
        card.onclick = () => joinMeetingById(meeting.id);
        
        card.innerHTML = `
            <div class="meeting-icon ${iconClasses[index % iconClasses.length]}">
                <i class="${icons[index % icons.length]}"></i>
            </div>
            <div class="meeting-details">
                <h3>${meeting.title}</h3>
                <p class="meeting-code">${meeting.id}</p>
                <p class="meeting-time">${formatMeetingTime(meeting.lastJoined)}</p>
            </div>
        `;
        
        meetingCards.appendChild(card);
    });
}

function loadSearchHistory() {
    try {
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        if (searchHistory.length > 0) {
            updateSearchHistoryDisplay(searchHistory);
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
    }
}

function updateSearchHistoryDisplay(history) {
    const historyList = document.querySelector('.history-list');
    if (!historyList || history.length === 0) return;
    
    historyList.innerHTML = '';
    
    history.slice(0, 3).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.onclick = () => {
            document.getElementById('meetingId').value = item.code;
            showNotification('Code copié depuis l\'historique', 'success');
        };
        
        historyItem.innerHTML = `
            <div class="history-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="history-details">
                <span class="history-code">${item.code}</span>
                <span class="history-date">${item.title} • Consulté ${formatHistoryTime(item.timestamp)}</span>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function joinMeetingById(meetingId) {
    document.getElementById('meetingId').value = meetingId;
    joinExistingMeeting();
}

function saveToHistory(meetingId) {
    try {
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        // Supprimer l'entrée existante si elle existe
        searchHistory = searchHistory.filter(item => item.code !== meetingId);
        
        // Ajouter la nouvelle entrée en tête
        searchHistory.unshift({
            code: meetingId,
            title: 'Réunion',
            timestamp: Date.now()
        });
        
        // Limiter à 10 entrées
        searchHistory = searchHistory.slice(0, 10);
        
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        
        // Mettre à jour l'affichage
        updateSearchHistoryDisplay(searchHistory);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde dans l\'historique:', error);
    }
}

function formatMeetingTime(timestamp) {
    if (!timestamp) return 'Récemment';
    
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
}

function formatHistoryTime(timestamp) {
    if (!timestamp) return 'récemment';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days === 1) return 'il y a 1 jour';
    if (days < 7) return `il y a ${days} jours`;
    return `il y a ${Math.floor(days / 7)} semaines`;
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function showNotification(message, type = 'info') {
    // Utiliser la fonction globale si disponible
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback simple
    console.log(`${type.toUpperCase()}: ${message}`);
    
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Export des fonctions pour utilisation globale
window.joinExistingMeeting = joinExistingMeeting;
window.scanCode = scanCode;
window.joinByInvitation = joinByInvitation;
window.joinMeetingById = joinMeetingById;
