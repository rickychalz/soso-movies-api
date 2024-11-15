import asyncHandler from "express-async-handler";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../middlewares/auth.middlewares.js";

//registering user
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, avatar } = req.body;

  try {
    // Fix: Logic error in validation
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error("Username, Email, Password are required");
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    if (user) {
      // Generate access token
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update user with access token
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

      return res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        accessToken,
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email });

    // If no user found
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Generate new access token
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update user's accessToken in database
    user.accessToken = token;
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Clear access token and refresh token from the user document
    user.accessToken = null;
    user.refreshToken = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message,
    });
  }
});

//update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, avatar } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = username || user.username;
      user.email = email || user.email;
      user.avatar = avatar || user.avatar;

      // Save the updated user information
      await user.save();

      // Send the updated user data and token to the client
      return res.status(200).json({
        success: true,
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateAccessToken(user._id),
      });
    } else {
      throw new Error("Failed to update information");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//delete user
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = User.findById(req.user._id);

    if (user) {
      await user.remove();
      res.status(200).json({ message: "User deleted successfully!" });
    } else {
      res.status(404);
      throw new Error("User not found!");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//change password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    user = User.findById(req.user._id);

    if (user && (await bcrypt.compare(oldPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      await user.save();
      res.status(200).json({ message: "Password changed successfully!" });
    } else {
      res.status(401);
      throw new Error("Invalid old password");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the refresh token
    const userId = verifyRefreshToken(token);

    // Find the user and generate a new access token
    const user = await User.findById(userId);
    if (!user || user.refreshToken !== token) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(user._id);

    // Update the user's refresh token
    user.refreshToken = generateRefreshToken(user._id);
    await user.save();

    return newAccessToken;
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



export {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  changePassword,
  refreshToken,
  logoutUser
};
