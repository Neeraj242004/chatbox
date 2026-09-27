
const Message = require("../models/Message");

// =========================
// SEND MESSAGE
// =========================

const sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;

    if (!receiver) {
      return res.status(400).json({
        message: "Receiver is required",
      });
    }

    if (!text?.trim() && !req.file) {
      return res.status(400).json({
        message: "Message text or file is required",
      });
    }

    const messageData = {
      sender: req.user,
      receiver,
      text: text?.trim() || "",
    };

    if (req.file) {
      messageData.fileUrl = `/uploads/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileType = req.file.mimetype;
      messageData.fileSize = req.file.size;
    }

    const message = await Message.create(messageData);

    await message.populate("sender", "name email");
    await message.populate("receiver", "name email");

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// GET MESSAGES + READ RECEIPTS
// =========================

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = String(req.user);

    const unreadMessages = await Message.find({
      sender: userId,
      receiver: req.user,
      read: false,
    }).select("_id");

    const messageIds = unreadMessages.map((msg) =>
      String(msg._id)
    );

    if (messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiver: req.user,
          read: false,
        },
        {
          $set: { read: true },
        }
      );

      const io = req.app.get("io");

      if (io) {
        io.to(String(userId)).emit("messagesRead", {
          messageIds,
          readBy: myId,
        });
      }
    }

    const messages = await Message.find({
      $or: [
        {
          sender: req.user,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user,
        },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("reactions.user", "name");

    res.json({
      message: "Messages fetched successfully",
      messages,
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// EDIT MESSAGE
// =========================

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        message: "Message text is required",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user,
      deleted: { $ne: true },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found or you cannot edit this message",
      });
    }

    message.text = text.trim();
    message.edited = true;

    await message.save();

    await message.populate("sender", "name email");
    await message.populate("receiver", "name email");
    await message.populate("reactions.user", "name");

    res.json({
      message: "Message updated successfully",
      data: message,
    });
  } catch (error) {
    console.error("EDIT MESSAGE ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// DELETE MESSAGE
// =========================

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user,
      deleted: { $ne: true },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found or you cannot delete this message",
      });
    }

    message.text = "This message was deleted";
    message.deleted = true;
    message.edited = false;
    message.fileUrl = "";
    message.fileName = "";
    message.fileType = "";
    message.fileSize = 0;
    message.reactions = [];

    await message.save();

    await message.populate("sender", "name email");
    await message.populate("receiver", "name email");

    res.json({
      message: "Message deleted successfully",
      data: message,
    });
  } catch (error) {
    console.error("DELETE MESSAGE ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// TOGGLE MESSAGE REACTION
// =========================

const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = String(req.user);

    const allowedEmojis = ["❤️", "😂", "😍", "😮", "😢", "👍"];

    if (!allowedEmojis.includes(emoji)) {
      return res.status(400).json({
        message: "Invalid emoji reaction",
      });
    }

    const message = await Message.findById(messageId);

    if (!message || message.deleted) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const senderId = String(message.sender);
    const receiverId = String(message.receiver);

    if (userId !== senderId && userId !== receiverId) {
      return res.status(403).json({
        message: "You cannot react to this message",
      });
    }

    if (!message.reactions) {
      message.reactions = [];
    }

    const existingIndex = message.reactions.findIndex(
      (reaction) => String(reaction.user) === userId
    );

    let action;

    if (
      existingIndex !== -1 &&
      message.reactions[existingIndex].emoji === emoji
    ) {
      message.reactions.splice(existingIndex, 1);
      action = "removed";
    } else if (existingIndex !== -1) {
      message.reactions[existingIndex].emoji = emoji;
      action = "updated";
    } else {
      message.reactions.push({
        user: req.user,
        emoji,
      });
      action = "added";
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("reactions.user", "name");

    const io = req.app.get("io");

    if (io) {
      io.to([senderId, receiverId]).emit("reactionUpdated", {
        messageId: String(message._id),
        reactions: updatedMessage.reactions,
      });
    }

    res.json({
      message: `Reaction ${action} successfully`,
      data: updatedMessage,
    });
  } catch (error) {
    console.error("REACTION ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// CHAT SUMMARY
// =========================

const getChatSummary = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user },
        { receiver: req.user },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    const summary = {};

    for (const msg of messages) {
      const senderId = String(msg.sender._id);
      const receiverId = String(msg.receiver._id);

      const otherUserId =
        senderId === String(req.user)
          ? receiverId
          : senderId;

      if (!summary[otherUserId]) {
        summary[otherUserId] = {
          lastMessage: msg.deleted
            ? "This message was deleted"
            : msg.text ||
              (msg.fileType?.startsWith("image/")
                ? "📷 Image"
                : msg.fileName
                  ? `📎 ${msg.fileName}`
                  : ""),
          unreadCount: 0,
        };
      }

      if (senderId !== String(req.user) && !msg.read) {
        summary[otherUserId].unreadCount += 1;
      }
    }

    res.json({
      message: "Chat summary fetched successfully",
      summary,
    });
  } catch (error) {
    console.error("CHAT SUMMARY ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  getChatSummary,
  toggleReaction,
};