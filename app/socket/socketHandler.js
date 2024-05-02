const socketIO = require("socket.io");
const formatMessages = require("../utils/messages");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { userLeave, userJoin, getRoomUsers } = require("../utils/user");

const JWT_SECRET_KEY = process.env.MY_CUSTOM_SECRET_KEY;

const initializeSocket = (server) => {
  const io = socketIO(server);

  io.on("connection", (socket) => {
    socket.on("joinRoom", (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        const { username, room } = decoded;
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        socket.emit("message", formatMessages("BOT", `${username} welcome!`));
        socket.broadcast.to(user.room).emit("message", formatMessages("BOT", `${username} just connected!`));
        io.to(user.room).emit("usersInRoom", {
          room: user.room,
          usersList: getRoomUsers(user.room),
        });

        socket.emit("usernameFromBackend", username);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("chatMsg", (data) => {
      const { msg, token } = data;
      try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        const { username, room } = decoded;
        io.to(room).emit("message", formatMessages(username, msg));
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
      if (user) {
        io.to(user.room).emit("message", formatMessages("BOT", `${user.username} has just left!`));
        io.to(user.room).emit("usersInRoom", {
          room: user.room,
          usersList: getRoomUsers(user.room),
        });
      }
    });
  });
};

module.exports = initializeSocket;
