const socket = io();
const currentUrl = window.location.href;
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// Store token in local storage if available
if (token) {
  localStorage.setItem("token", token);
}

// Check if token is null in local storage
const tokenInStorage = localStorage.getItem("token");

if (tokenInStorage === "null") {
  const message = "You are not authorized to access this page.";
  window.location.href = `../index.html?message=${message}&status=fail`;
}

// Get the page-specific key for the username in local storage
const usernameKey = `username_${currentUrl}`;

// Only set the username in local storage if it's not already set for this page
if (!localStorage.getItem(usernameKey)) {
  socket.on("usernameFromBackend", (username) => {
    console.log("Received username from backend:", username);
    localStorage.setItem(usernameKey, username);
  });
}

// Output message to chat window
// Output message to chat window
function outputMsg(data) {
  const div = document.createElement("div");
  const container = document.querySelector(".chat-messages");
  div.classList.add("message");

  // Get the page-specific key for the username in local storage
  const usernameKey = `username_${currentUrl}`;

  // Get the username from local storage using the page-specific key
  const username = localStorage.getItem(usernameKey);

  // Check if the message is from the current user or another user
  const isCurrentUser = data.username === username;

  // Set the background color based on whether the message is from the current user or another user
  if (isCurrentUser) {
    div.classList.add("message-self"); 
    div.innerHTML = `<p class='meta'>You (${data.username})
    <span>${data.time}</span></p><p class='text'>${data.text}</p>`;// Add a class for messages from the current user
  } else {
    div.classList.add("message-other"); 
    div.innerHTML = `<p class='meta'>${data.username}
  <span>${data.time}</span></p><p class='text'>${data.text}</p>`;// Add a class for messages from other users
  }

  container.appendChild(div);

  // Scroll to bottom of messages
  container.scrollTop = container.scrollHeight;
}


// Send message event listener
const chatForm = document.getElementById("chat-form");
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = e.target.elements.msg.value;
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
  socket.emit("chatMsg", { msg, token });
});

// Listen for messages from server
socket.on("message", (data) => {
  const currentTokenInStorage = localStorage.getItem("token");
  if (!currentTokenInStorage) {
    const message = "You are not authorized to access this page.";
    return (window.location.href = `../index.html?message=${message}&status=fail`);
  }
  outputMsg(data);
  // Scroll to bottom of messages
  const messagesContainer = document.querySelector(".chat-messages");
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Leave chat button event listener
document.getElementById("leave-btn").addEventListener("click", () => {
  const conf = confirm("Are you sure, you want to leave the chat?");
  if (conf) {
    window.location.href = "../";
  }
});

// Join room with token
socket.emit("joinRoom", token);

// Update room name and user list
const roomName = document.getElementById("room-name");
const usersList = document.getElementById("users");

const outputRoom = (room) => {
  roomName.innerText = room;
};
const outputUsers = (users) => {
  const usernameKey = `username_${currentUrl}`;
  const username = localStorage.getItem(usernameKey);

  let isCurrentUser = false;

  const userListItems = users.map((user) => {
    if (user.username === username) {
      isCurrentUser = true;
      return `<li>${user.username} (You)</li>`;
    } else {
      return `<li>${user.username}</li>`;
    }
  }).join("");

  usersList.innerHTML = userListItems;
};

socket.on("usersInRoom", (data) => {
  outputRoom(data.room);
  outputUsers(data.usersList);
});

const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const sidebar = document.querySelector(".chat-sidebar");
const chatMain = document.querySelector(".chat-main");

toggleSidebarBtn.addEventListener("click", () => {
  chatMain.classList.toggle("collapsed");
});

//Pusher

// Initialize Channels client
let channels = new Pusher('7bb00c5ffa56633e55c9', {
  cluster: 'us2',
});

// Subscribe to the appropriate channel
let channel = channels.subscribe('Chat App');

// Bind a callback function to an event within the subscribed channel
channel.bind('event-name', function (data) {
  // Do what you wish with the data from the event
});

async function pushData(data) {
  const res = await fetch('/api/channels-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    console.error('failed to push data');
  }
}
