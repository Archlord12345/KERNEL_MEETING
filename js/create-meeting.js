// JavaScript pour la page de création de réunion

document.addEventListener('DOMContentLoaded', function() {
    initializeCreateMeetingPage();
});

function initializeCreateMeetingPage() {
    // Charger les réunions récentes
    loadRecentMeetings();
    
    // Initialiser les événements
    setupEventListeners();
    
    // Définir la date et l'heure actuelles
    setDefaultDateTime();
}

function setupEventListeners() {
    // Gestion du formulaire de création
    const createForm = document.getElementById('createMeetingForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateMeetingSubmit);
    }
    
    // Gestion du toggle de mot de passe
    const passwordToggle = document.getElementById('requirePassword');
    if (passwordToggle) {
        passwordToggle.addEventListener('change', togglePasswordSection);
    }
    
    // Gestion du slider de participants
    const participantSlider = document.getElementById('maxParticipants');
    if (participantSlider) {
        participantSlider.addEventListener('input', updateParticipantValue);
    }
    
    // Gestion des clics sur l'historique
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            const meetingId = item.querySelector('.history-id').textContent;
            joinMeetingById(meetingId);
        });
    });
}

function setDefaultDateTime() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const dateInput = document.getElementById('meetingDate');
    const timeInput = document.getElementById('meetingTime');
    
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
    }
    
    if (timeInput && !timeInput.value) {
        // Ajouter 30 minutes à l'heure actuelle
        const futureTime = new Date(now.getTime() + 30 * 60000);
        timeInput.value = futureTime.toTimeString().split(' ')[0].substring(0, 5);
    }
}

function loadRecentMeetings() {
    // Simuler le chargement des réunions récentes depuis le localStorage ou l'API
    const recentMeetings = getRecentMeetingsFromStorage();
    
    if (recentMeetings.length > 0) {
        updateRecentMeetingsDisplay(recentMeetings);
    }
}

function getRecentMeetingsFromStorage() {
    try {
        const stored = localStorage.getItem('recentMeetings');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Erreur lors du chargement des réunions récentes:', error);
        return [];
    }
}

function updateRecentMeetingsDisplay(meetings) {
    const categoriesContainer = document.querySelector('.meeting-categories');
    const historyContainer = document.querySelector('.search-history');
    
    if (!categoriesContainer || !historyContainer) return;
    
    // Mettre à jour les catégories avec les vraies données
    if (meetings.length > 0) {
        categoriesContainer.innerHTML = meetings.slice(0, 3).map(meeting => `
            <div class="category" onclick="joinMeetingById('${meeting.id}')">
                <h3>${meeting.title}</h3>
                <p class="meeting-date">${formatDate(meeting.date)}</p>
                <p class="meeting-time">${meeting.time} - ${calculateEndTime(meeting.time, meeting.duration)}</p>
            </div>
        `).join('');
        
        // Mettre à jour l'historique
        const historyHTML = meetings.slice(0, 5).map(meeting => `
            <div class="history-item" onclick="joinMeetingById('${meeting.id}')">
                <div class="history-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="history-content">
                    <span class="history-id">${meeting.id}</span>
                    <span class="history-date">${getRelativeTime(meeting.createdAt)} - ${meeting.title}</span>
                </div>
            </div>
        `).join('');
        
        const historyList = historyContainer.querySelector('.history-item')?.parentElement;
        if (historyList) {
            historyList.innerHTML = historyHTML;
        }
    }
}

function handleCreateMeetingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const meetingData = {
        id: generateMeetingId(),
        title: formData.get('meetingTitle') || 'Nouvelle réunion',
        description: formData.get('meetingDescription') || '',
        date: formData.get('meetingDate'),
        time: formData.get('meetingTime'),
        duration: parseInt(formData.get('meetingDuration')) || 60,
        language: formData.get('meetingLanguage') || 'fr',
        requirePassword: document.getElementById('requirePassword')?.checked || false,
        password: formData.get('meetingPassword') || '',
        maxParticipants: parseInt(document.getElementById('maxParticipants')?.value) || 10,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user' // À remplacer par l'utilisateur connecté
    };
    
    // Validation
    if (!validateMeetingData(meetingData)) {
        return;
    }
    
    // Créer la réunion
    createNewMeeting(meetingData);
}

function validateMeetingData(data) {
    if (!data.title.trim()) {
        showNotification('Le titre de la réunion est requis', 'warning');
        return false;
    }
    
    if (!data.date) {
        showNotification('La date de la réunion est requise', 'warning');
        return false;
    }
    
    if (!data.time) {
        showNotification('L\'heure de la réunion est requise', 'warning');
        return false;
    }
    
    if (data.requirePassword && !data.password) {
        showNotification('Veuillez définir un mot de passe pour la réunion', 'warning');
        return false;
    }
    
    // Vérifier que la date/heure n'est pas dans le passé
    const meetingDateTime = new Date(`${data.date}T${data.time}`);
    const now = new Date();
    
    if (meetingDateTime < now) {
        showNotification('La date et l\'heure de la réunion ne peuvent pas être dans le passé', 'warning');
        return false;
    }
    
    return true;
}

function createNewMeeting(meetingData) {
    showNotification('Création de la réunion en cours...', 'info');
    
    // Sauvegarder dans le localStorage
    saveMeetingToStorage(meetingData);
    
    // Simuler un délai de création
    setTimeout(() => {
        showNotification('Réunion créée avec succès!', 'success');
        
        // Fermer le modal si ouvert
        const modal = document.getElementById('createMeetingModal');
        if (modal && modal.style.display === 'block') {
            closeModal('createMeetingModal');
        }
        
        // Rediriger vers la réunion après un court délai
        setTimeout(() => {
            window.location.href = `meeting.html?room=${meetingData.id}&host=true`;
        }, 1500);
    }, 1000);
}

function saveMeetingToStorage(meetingData) {
    try {
        const recentMeetings = getRecentMeetingsFromStorage();
        recentMeetings.unshift(meetingData);
        
        // Garder seulement les 10 dernières réunions
        const limitedMeetings = recentMeetings.slice(0, 10);
        
        localStorage.setItem('recentMeetings', JSON.stringify(limitedMeetings));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

function joinExistingMeeting() {
    const meetingId = document.getElementById('meetingId')?.value?.trim();
    
    if (!meetingId) {
        showNotification('Veuillez entrer l\'ID de la réunion', 'warning');
        return;
    }
    
    joinMeetingById(meetingId);
}

function joinMeetingById(meetingId) {
    if (!meetingId) return;
    
    showNotification('Connexion à la réunion...', 'info');
    
    // Ajouter à l'historique de recherche
    addToSearchHistory(meetingId);
    
    setTimeout(() => {
        window.location.href = `meeting.html?room=${meetingId}`;
    }, 1000);
}

function addToSearchHistory(meetingId) {
    try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const existingIndex = history.findIndex(item => item.id === meetingId);
        
        const historyItem = {
            id: meetingId,
            accessedAt: new Date().toISOString(),
            title: `Réunion ${meetingId}`
        };
        
        if (existingIndex >= 0) {
            history[existingIndex] = historyItem;
        } else {
            history.unshift(historyItem);
        }
        
        // Garder seulement les 10 derniers
        localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
}

function showCreateForm() {
    const modal = document.getElementById('createMeetingModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function createNewMeetingRedirect() {
    // Générer un ID de réunion et rediriger directement
    const roomId = generateMeetingId();
    showNotification('Création d\'une réunion instantanée...', 'info');
    
    setTimeout(() => {
        window.location.href = `meeting.html?room=${roomId}&host=true`;
    }, 1000);
}

function refreshMeetings() {
    showNotification('Actualisation des réunions...', 'info');
    
    setTimeout(() => {
        loadRecentMeetings();
        showNotification('Réunions actualisées', 'success');
    }, 1000);
}

function togglePasswordSection() {
    const passwordSection = document.getElementById('passwordSection');
    const checkbox = document.getElementById('requirePassword');
    
    if (passwordSection && checkbox) {
        passwordSection.style.display = checkbox.checked ? 'block' : 'none';
        
        if (checkbox.checked) {
            const passwordInput = document.getElementById('meetingPassword');
            if (passwordInput) {
                setTimeout(() => passwordInput.focus(), 100);
            }
        }
    }
}

function updateParticipantValue() {
    const slider = document.getElementById('maxParticipants');
    const valueDisplay = document.querySelector('.slider-value');
    
    if (slider && valueDisplay) {
        valueDisplay.textContent = slider.value;
    }
}

// Fonctions utilitaires
function generateMeetingId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toTimeString().split(' ')[0].substring(0, 5);
}

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function showNotification(message, type = 'info') {
    // Utiliser la fonction de notification du fichier main.js si disponible
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback simple
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message);
}

// Fonction pour scanner un code QR (simulation)
function scanCode() {
    showNotification('Fonction de scan QR à venir...', 'info');
    // Ici on pourrait intégrer une bibliothèque de scan QR comme QuaggaJS ou ZXing
}

// Export des fonctions pour utilisation globale
window.joinExistingMeeting = joinExistingMeeting;
window.showCreateForm = showCreateForm;
window.createNewMeeting = createNewMeetingRedirect;
window.refreshMeetings = refreshMeetings;
window.joinMeetingById = joinMeetingById;
window.scanCode = scanCode;
