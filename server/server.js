const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const User = require("./models/User");
const path = require("path");

const app = express();

const server = http.createServer(app);

// =========================
// SOCKET.IO
// =========================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);
// =========================
// MIDDLEWARE
// =========================

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================
// ROUTES
// =========================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

// =========================
// HOME
// =========================

app.get("/", (req, res) => {
  res.json({
    message:
      "Chatbox backend is running 🚀",
  });
});

// =========================
// SOCKET CONNECTION
// =========================

io.on("connection", (socket) => {
  console.log(
    "Socket connected:",
    socket.id
  );

  // =========================
  // JOIN ROOM
  // =========================

  socket.on(
    "joinRoom",
    async (userId) => {
      try {
        if (!userId) {
          return;
        }

        socket.userId =
          String(userId);

        socket.join(
          String(userId)
        );

        console.log(
          `User ${userId} joined room`
        );

        // User online
        await User.findByIdAndUpdate(
          userId,
          {
            status: "online",
          }
        );

        // Notify everyone
        io.emit(
          "userStatusChanged",
          {
            userId: String(
              userId
            ),
            status: "online",
          }
        );

        // Get online users
        const onlineUsers =
          await User.find({
            status: "online",
          }).select("_id");

        const onlineUserIds =
          onlineUsers.map(
            (user) =>
              String(user._id)
          );

        // Send online users
        socket.emit(
          "onlineUsers",
          onlineUserIds
        );
      } catch (error) {
        console.error(
          "Join room error:",
          error.message
        );
      }
    }
  );

  // =========================
  // TYPING
  // =========================

  socket.on(
    "typing",
    (data) => {
      try {
        if (
          !data ||
          !data.receiver
        ) {
          return;
        }

        socket
          .to(
            String(
              data.receiver
            )
          )
          .emit(
            "userTyping",
            {
              sender:
                String(
                  data.sender
                ),

              isTyping:
                data.isTyping,
            }
          );
      } catch (error) {
        console.error(
          "Typing error:",
          error.message
        );
      }
    }
  );

  // =========================
  // SEND MESSAGE
  // =========================

  socket.on(
    "sendMessage",
    (data) => {
      try {
        if (
          !data ||
          !data.receiver ||
          !data.message
        ) {
          return;
        }

        console.log(
          "Real-time message to:",
          data.receiver
        );

        io.to(
          String(
            data.receiver
          )
        ).emit(
          "receiveMessage",
          data.message
        );
      } catch (error) {
        console.error(
          "Send message socket error:",
          error.message
        );
      }
    }
  );

  // =========================
  // EDIT MESSAGE
  // =========================

  socket.on(
    "messageUpdated",
    (data) => {
      try {
        if (
          !data ||
          !data.receiver ||
          !data.message
        ) {
          return;
        }

        console.log(
          "Real-time message update to:",
          data.receiver
        );

        io.to(
          String(
            data.receiver
          )
        ).emit(
          "messageUpdated",
          data.message
        );
      } catch (error) {
        console.error(
          "Message update socket error:",
          error.message
        );
      }
    }
  );

  // =========================
  // DELETE MESSAGE
  // =========================

  socket.on(
    "messageDeleted",
    (data) => {
      try {
        if (
          !data ||
          !data.receiver ||
          !data.message
        ) {
          return;
        }

        console.log(
          "Real-time message delete to:",
          data.receiver
        );

        io.to(
          String(
            data.receiver
          )
        ).emit(
          "messageDeleted",
          data.message
        );
      } catch (error) {
        console.error(
          "Message delete socket error:",
          error.message
        );
      }
    }
  );

  // =========================
  // DISCONNECT
  // =========================

  socket.on(
    "disconnect",
    async () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );

      try {
        if (!socket.userId) {
          return;
        }

        const userId =
          String(
            socket.userId
          );

        // Check if user has
        // another active connection
        const sockets =
          await io
            .in(userId)
            .fetchSockets();

        if (
          sockets.length > 0
        ) {
          console.log(
            `User ${userId} still has another active connection`
          );

          return;
        }

        // User offline
        await User.findByIdAndUpdate(
          userId,
          {
            status: "offline",
          }
        );

        // Notify everyone
        io.emit(
          "userStatusChanged",
          {
            userId,
            status: "offline",
          }
        );

        console.log(
          `User ${userId} is OFFLINE`
        );
      } catch (error) {
        console.error(
          "Disconnect error:",
          error.message
        );
      }
    }
  );
});

// =========================
// MONGODB
// =========================

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {
    console.log(
      "MongoDB connected successfully ✅"
    );

    const PORT =
      process.env.PORT || 5000;

    server.listen(
      PORT,
      () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      }
    );
  })
  .catch((error) => {
    console.log(
      "MongoDB connection failed ❌"
    );

    console.log(
      error.message
    );
  });