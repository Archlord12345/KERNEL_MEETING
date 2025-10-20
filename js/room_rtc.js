// Generate unique user ID
let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}

// Get room ID from URL parameters
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    roomId = 'main'
}

// Get display name from session storage
let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'lobby.html'
}

let sharingScreen = false;

// Initialize room connection
let joinRoomInit = async () => {
    // Initialize WebRTC manager
    webrtcManager.initializeSocket();
    
    // Join the room
    await webrtcManager.joinRoom(roomId, uid, displayName);
}

let joinStream = async () => {
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    try {
        // Get user media using WebRTC manager
        await webrtcManager.getUserMedia();
        
        // Create peer connections with existing users
        webrtcManager.peerConnections.forEach(async (peerConnection, userId) => {
            await webrtcManager.sendOffer(userId);
        });
    } catch (error) {
        console.error('Error joining stream:', error);
        alert('Could not access camera and microphone. Please check permissions.');
    }
}

let switchToCamera = async () => {
    await webrtcManager.stopScreenShare();
    
    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')
    
    // Re-display local camera stream
    webrtcManager.displayLocalStream();
}

// This function is now handled by WebRTC manager
// Remote streams are automatically displayed when received

// This function is now handled by WebRTC manager
// User cleanup is automatically handled when users leave

let toggleMic = async (e) => {
    let button = e.currentTarget
    
    const isEnabled = webrtcManager.toggleMicrophone();
    
    if(isEnabled){
        button.classList.add('active')
    }else{
        button.classList.remove('active')
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget
    
    const isEnabled = webrtcManager.toggleCamera();
    
    if(isEnabled){
        button.classList.add('active')
    }else{
        button.classList.remove('active')
    }
}

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if(!sharingScreen){
        const success = await webrtcManager.startScreenShare();
        
        if(success) {
            sharingScreen = true
            screenButton.classList.add('active')
            cameraButton.classList.remove('active')
            cameraButton.style.display = 'none'
            
            // Update display frame
            document.getElementById(`user-container-${uid}`).remove()
            displayFrame.style.display = 'block'
            
            let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`
            
            displayFrame.insertAdjacentHTML('beforeend', player)
            document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
            
            userIdInDisplayFrame = `user-container-${uid}`
            
            // Update other video frames size
            let videoFrames = document.getElementsByClassName('video__container')
            for(let i = 0; videoFrames.length > i; i++){
                if(videoFrames[i].id != userIdInDisplayFrame){
                  videoFrames[i].style.height = '100px'
                  videoFrames[i].style.width = '100px'
                }
              }
        }
    }else{
        sharingScreen = false 
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        
        await webrtcManager.stopScreenShare();
        switchToCamera()
    }
}

let leaveStream = async (e) => {
    e.preventDefault()

    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    // Leave room using WebRTC manager
    await webrtcManager.leaveRoom();

    // Reset screen sharing state
    sharingScreen = false;
    
    // Reset display frame
    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null
        
        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; i < videoFrames.length; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}



document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)


joinRoomInit()