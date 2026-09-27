
const express = require("express");

const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  getChatSummary,
  toggleReaction,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Send text, image, or file message
router.post(
  "/send",
  protect,
  upload.single("file"),
  sendMessage
);

// Chat summary
router.get(
  "/summary",
  protect,
  getChatSummary
);

// Toggle message reaction
router.put(
  "/:messageId/reactions",
  protect,
  toggleReaction
);

// Edit message
router.put(
  "/:messageId",
  protect,
  editMessage
);

// Delete message
router.delete(
  "/:messageId",
  protect,
  deleteMessage
);

// Get messages
router.get(
  "/:userId",
  protect,
  getMessages
);

module.exports = router;