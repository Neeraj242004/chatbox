
const express = require("express");

const {
  register,
  login,
  updateProfile,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

// Get logged-in user's profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// Update logged-in user's profile
router.put("/profile", protect, updateProfile);

// Get all users except logged-in user
router.get("/users", protect, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user },
    }).select("-password");

    res.json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;