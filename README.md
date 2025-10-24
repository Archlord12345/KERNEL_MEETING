# VideoConf - Application de Vidéoconférence Moderne

Une application de vidéoconférence complète et moderne construite avec **React + Vite** (frontend) et **Node.js/Express + Socket.IO** (backend), offrant une interface utilisateur élégante et des fonctionnalités avancées.

## ✨ Fonctionnalités

### 🎥 Vidéoconférence
- **Appels vidéo haute qualité** : Communication peer-to-peer avec WebRTC
- **Audio cristallin** : Suppression d'écho et de bruit intégrée
- **Partage d'écran** : Partagez votre écran en temps réel
- **Contrôles intuitifs** : Couper/activer micro et caméra facilement

### 💬 Communication
- **Chat en temps réel** : Messagerie instantanée pendant les réunions
- **Notifications** : Alertes élégantes pour les actions importantes
- **Historique** : Sauvegarde des messages et réunions récentes

### 🏢 Gestion des réunions
- **Création simplifiée** : Interface moderne pour créer des réunions
- **Planification** : Programmez vos réunions à l'avance
- **Sécurité** : Protection par mot de passe optionnelle
- **Limites de participants** : Contrôlez le nombre de participants

### 🎨 Interface utilisateur
- **Design moderne** : Interface élégante et responsive
- **Mobile-friendly** : Optimisé pour tous les appareils
- **Animations fluides** : Transitions et effets visuels

## 🚀 Technologies utilisées

- **Backend** : Node.js, Express.js, Socket.IO
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Communication temps réel** : WebRTC, Socket.IO
- **Styles** : CSS moderne avec Flexbox et Grid
- **Icônes** : Font Awesome 6
- **Polices** : Inter (Google Fonts)

## 📦 Installation

1. **Cloner le repository** :
   ```bash
   git clone <repository-url>
   cd mumble2
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Démarrer le serveur** :
   ```bash
   npm start
   ```

4. **Ouvrir l'application** :
   Naviguez vers `http://localhost:3000`

## 🎯 Utilisation

### Page d'accueil
- **Interface moderne** avec logo et fonctionnalités mises en avant
- **Création rapide** de réunion avec un clic
- **Rejoindre** une réunion avec un code

### Créer une réunion
1. Cliquez sur "Nouvelle réunion"
2. Remplissez les détails (titre, description, date/heure)
3. Configurez les options (mot de passe, participants max)
4. Cliquez sur "Créer la réunion"

### Rejoindre une réunion
1. Entrez l'ID de la réunion
2. Cliquez sur "Rejoindre"
3. Autorisez l'accès caméra/micro
4. Profitez de votre réunion !

### Pendant une réunion
- **🎤 Micro** : Coupez/activez avec `Ctrl+M`
- **📹 Caméra** : Activez/désactivez avec `Ctrl+E`
- **🖥️ Partage d'écran** : Partagez votre écran avec `Ctrl+D`
- **💬 Chat** : Communiquez par messages
- **🚪 Quitter** : Bouton rouge pour quitter

## 🛠️ Développement

### Mode développement
```bash
npm run dev
```

### Structure du projet
```
mumble2/
├── server.js              # Serveur principal
├── index.html             # Page d'accueil
├── create-meeting.html    # Page de création
├── meeting.html           # Interface de réunion
├── js/                   # JavaScript client
│   ├── main.js           # Fonctions principales
│   ├── create-meeting.js # Création de réunions
│   └── meeting.js        # Interface de réunion
├── styles/               # Styles CSS
│   └── main.css          # Styles principaux
└── package.json          # Configuration npm
```

## 🔌 API et Événements

### Endpoints REST
- `GET /` - Page d'accueil
- `GET /create-meeting.html` - Page de création
- `GET /meeting.html` - Interface de réunion
- `GET /api/meetings` - Liste des réunions actives
- `GET /api/meetings/:id` - Détails d'une réunion

### Événements Socket.IO

#### Client → Serveur
- `create-meeting` - Créer une réunion
- `join-meeting` - Rejoindre une réunion
- `join-room` - Rejoindre une salle
- `offer/answer/ice-candidate` - Signalisation WebRTC
- `chat-message` - Envoyer un message
- `leave-room` - Quitter la salle

#### Serveur → Client
- `meeting-created` - Réunion créée
- `meeting-joined` - Réunion rejointe
- `user-joined/user-left` - Utilisateur rejoint/quitté
- `chat-message` - Message reçu
- `room-full` - Salle pleine
- `error` - Erreur

## 🔒 Sécurité

- **CSP** : Content Security Policy stricte
- **Validation** : Sanitisation des entrées utilisateur
- **Chiffrement** : Communication WebRTC sécurisée
- **Protection XSS** : Headers de sécurité
- **Nettoyage automatique** : Suppression des salles vides

## 🌐 Compatibilité navigateurs

- **Chrome** 60+
- **Firefox** 55+
- **Safari** 11+
- **Edge** 79+

## 📱 Responsive Design

L'application s'adapte automatiquement à tous les types d'écrans :
- **Desktop** : Interface complète avec tous les panneaux
- **Tablette** : Layout adapté avec navigation optimisée
- **Mobile** : Interface simplifiée et tactile

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ pour une communication moderne et efficace**
