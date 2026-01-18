import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let userNames = {}; // Store username for each socket.id

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("SOMEONE CONNECTED");

    socket.on("join-call", (path, username) => {
      // Extract meeting code from path (could be URL or just meeting code)
      const meetingCode = path.includes('/') ? path.split('/').pop() : path;
      
      // Store username for this socket
      if (username) {
        userNames[socket.id] = username;
      } else {
        // If no username provided, use a default
        userNames[socket.id] = `User ${socket.id.substring(0, 8)}`;
      }
      
      if (connections[meetingCode] === undefined) {
        connections[meetingCode] = [];
        // Clear messages for new room
        messages[meetingCode] = [];
      }
      connections[meetingCode].push(socket.id);

      timeOnline[socket.id] = new Date();

      // Emit user-joined with username info
      for (let a = 0; a < connections[meetingCode].length; a++) {
        const socketId = connections[meetingCode][a];
        const userInfo = {
          socketId: socket.id,
          username: userNames[socket.id] || `User ${socket.id.substring(0, 8)}`,
          allClients: connections[meetingCode].map(id => ({
            socketId: id,
            username: userNames[id] || `User ${id.substring(0, 8)}`
          }))
        };
        io.to(socketId).emit("user-joined", socket.id, connections[meetingCode], userInfo);
      }

      // Send existing messages only if room already has messages
      if (messages[meetingCode] !== undefined && messages[meetingCode].length > 0) {
        for (let a = 0; a < messages[meetingCode].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[meetingCode][a]["data"],
            messages[meetingCode][a]["sender"],
            messages[meetingCode][a]["socket-id-sender"]
          );
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ["", false]
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("message", matchingRoom, ":", sender, data);

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());

      var key;

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;

            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            var index = connections[key].indexOf(socket.id);

            connections[key].splice(index, 1);

            // Remove username mapping
            if (userNames[socket.id]) {
              delete userNames[socket.id];
            }
            
            if (connections[key].length === 0) {
              delete connections[key];
              // Clear messages when room is empty
              if (messages[key] !== undefined) {
                delete messages[key];
              }
            }
          }
        }
      }
    });
  });

  return io;
};
