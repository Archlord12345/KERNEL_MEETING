// Member management functions for Socket.IO integration

let handleMemberJoined = async (userId, displayName) => {
    console.log('A new member has joined the room:', displayName)
    addMemberToDom(userId, displayName)
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)
}

let addMemberToDom = async (userId, displayName) => {
    let membersWrapper = document.getElementById('member__list')
    let memberItem = `<div class="member__wrapper" id="member__${userId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${displayName}</p>
                    </div>`

    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}

let updateMemberTotal = async (count) => {
    let total = document.getElementById('members__count')
    total.innerText = count
}
 
let handleMemberLeft = async (userId, displayName) => {
    removeMemberFromDom(userId, displayName)
}

let removeMemberFromDom = async (userId, displayName) => {
    let memberWrapper = document.getElementById(`member__${userId}__wrapper`)
    if (memberWrapper) {
        addBotMessageToDom(`${displayName} has left the room.`)
        memberWrapper.remove()
    }
}

// This function is now handled by the WebRTC manager
// Members are automatically added when room-members event is received

// Message handling is now done through WebRTC manager
// Chat messages are handled via Socket.IO events

let sendMessage = async (e) => {
    e.preventDefault()

    let message = e.target.message.value
    if (message.trim()) {
        webrtcManager.sendChatMessage(message)
        addMessageToDom(displayName, message)
        e.target.reset()
    }
}

let addMessageToDom = (name, message) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}


let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Mumble Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let leaveChannel = async () => {
    await webrtcManager.leaveRoom()
}

window.addEventListener('beforeunload', leaveChannel)
let messageForm = document.getElementById('message__form')
messageForm.addEventListener('submit', sendMessage)