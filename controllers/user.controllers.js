import asyncHandler from "express-async-handler";
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerifyToken,
  verifyRefreshToken,
} from "../middlewares/auth.middlewares.js";
import transporter from "../controllers/nodemailer.js";
import jwt from 'jsonwebtoken';
import * as fs from 'fs/promises';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Your Google Client ID

//registering user
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, avatar } = req.body;

  let isNewUser = false;

  try {
    // Validation checks
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    isNewUser = true

    // Create user with verification token
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar,
      isEmailVerified: false,
      isNewUser
    });

    if (user) {
      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      // Generate verification token 
    const verificationToken = generateVerifyToken(user._id);
    console.log('Generated verification token:', verificationToken);


      // Update user tokens
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      user.verificationToken = verificationToken;
      await user.save();

      // Generate verification URL
      const verificationUrl = `${process.env.BASE_URL}/api/users/verify-email?token=${verificationToken}`;
      console.log('Verification URL:', verificationUrl);

      // Send verification email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Please Verify Your Email",
        text: `Click this link to verify your email: ${verificationUrl}`,
        html: `
          <h1>Email Verification</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in ${process.env.VERIFY_TOKEN_EXPIRY || '1 hour'}.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully');

      isNewUser = true

      res.status(201).json({
        success: true,
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        accessToken,
        message: "Registration successful. Please check your email to verify your account.",
        isNewUser
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

//verify email
const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.query.token;
  console.log('Received verification token:', token);
  
  let isNewUser = false;

  if (!token) {
    res.status(400);
    throw new Error("Token is missing");
  }

  try {
    console.log('VERIFY_TOKEN_SECRET:', process.env.VERIFY_TOKEN_SECRET);
    const decoded = jwt.verify(token, process.env.VERIFY_TOKEN_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findOne({ 
      _id: decoded.id, 
      verificationToken: token 
    });
    console.log('Found user:', user);

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired token.");
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    console.log('User verified successfully');

    isNewUser = true;

    // Create an object with the data you want to send
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: user.accessToken,
      favoriteGenres:user.favoriteGenres,
      message: "Email verified successfully!",
      isNewUser,
    };

    console.log(userData);

    // Serialize the data (convert object to a string)
    const serializedData = JSON.stringify(userData);

    // Encode the data for safe URL transmission
    const encodedData = encodeURIComponent(serializedData);

    // Send the encoded data through a URL query parameter
    res.redirect(302, `http://localhost:3000/email-verification?data=${encodedData}`);
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400);
    throw new Error("Invalid or expired token.");
  }
});

//login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let isNewUser = false;

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

    isNewUser = false;

    return res.status(200).json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      favoriteGenres:user.favoriteGenres,
      token,
      isNewUser
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
        message: "User not found",
      });
    }

    // Clear access token and refresh token from the user document
    user.accessToken = null;
    user.refreshToken = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error logging out",
      error: error.message,
    });
  }
});

//update user profile
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Update basic information
    if (username) user.username = username;
    if (email) user.email = email;

    // Handle avatar update if there's a new file
    if (req.file) {
      // Delete old avatar if it exists
      if (user.avatar) {
        const oldAvatarPath = join(__dirname, '..', user.avatar); // Updated to use join
        try {
          await fs.access(oldAvatarPath);
          await fs.unlink(oldAvatarPath);
        } catch (error) {
          console.log('No old avatar file to delete');
        }
      }

      // Update avatar path in database
      // Store relative path from uploads directory
      user.avatar = req.file.path.replace('public/temp/', '');
    }

    // Save the updated user information
    await user.save();

    // Send the updated user data and token
    return res.status(200).json({
      success: true,
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateAccessToken(user._id),
    });

  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400).json({ message: error.message });
  }
});

//delete user
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      await User.deleteOne({ _id: user._id });
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
    // Find the user by ID using req.user._id
    const user = await User.findById(req.user._id);

    if (user && (await bcrypt.compare(oldPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the user's password
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

//refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the refresh token
    const userId = verifyRefreshToken(token);

    // Find the user and generate a new access token
    const user = await User.findById(userId);
    if (!user || user.refreshToken !== token) {
      res.status(401);
      throw new Error("Invalid refresh token");
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

//google signin
const googleLogin = asyncHandler(async (req, res) => {
  const { email, name, avatar, googleId } = req.body;  // Assume these are passed from the frontend

  try {
    // Check if the user already exists in the database
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      // If user exists, update their Google login info (e.g., avatar, social login info)
      user.socialLogin = { provider: "google", providerId: googleId };
      user.avatar = avatar;  // Update avatar if provided

      // Generate new tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      isNewUser = false;

      // Save the updated user
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

      // Respond with user info and tokens
      return res.status(200).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        favoriteGenres:user.favoriteGenres,
        token: accessToken,
        isNewUser
      });
    } else {
      // If the user does not exist, create a new user with social login info
      user = new User({
        username: name,  // You can modify this logic to set a default username if needed
        email,
        avatar,
        socialLogin: { provider: "google", providerId: googleId },
        isEmailVerified: true, // For social logins, we assume email is verified
      });
      isNewUser = true;
      // Generate new tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save the new user
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

      // Respond with user info and tokens
      return res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        favoriteGenres:user.favoriteGenres,
        token: accessToken,
        isNewUser
      });
    }
  } catch (error) {
    console.error("Error during Google login:", error);
    res.status(500).json({ message: "Server error during Google login" });
  }
});

//add to favorites
const addFavoriteGenres = asyncHandler(async (req, res) => {
  const { genres } = req.body; // Array of { id, name } objects

  if (!genres || genres.length === 0) {
    return res.status(400).json({ message: "Please provide genres to add." });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  // Prevent duplicate genres by checking both id and name
  const uniqueGenres = genres.filter(newGenre => 
    !user.favoriteGenres.some(existingGenre => 
      existingGenre.id === newGenre.id
    )
  );

  user.favoriteGenres = [...user.favoriteGenres, ...uniqueGenres];
  await user.save();

  return res.status(200).json({ 
    message: "Favorite genres updated successfully.", 
    favoriteGenres: user.favoriteGenres 
  });
});

//remove favorite genre
const deleteFavoriteGenre = asyncHandler(async (req, res) => {
  const { genreId } = req.body;

  if (!genreId) {
    return res.status(400).json({ message: "Genre ID is required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Remove the genre with the specified ID
  user.favoriteGenres = user.favoriteGenres.filter(genre => genre.id !== genreId);

  await user.save();

  return res.status(200).json({ 
    message: "Genre deleted successfully", 
    favoriteGenres: user.favoriteGenres 
  });
});

//get favorite genres
const getFavoriteGenres = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favoriteGenres');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      favoriteGenres: user.favoriteGenres
    });
  } catch (error) {
    console.error('Error fetching favorite genres:', error);
    return res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
});

export {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  changePassword,
  refreshToken,
  verifyEmail,
  logoutUser,
  googleLogin,
  addFavoriteGenres,
  getFavoriteGenres,
  deleteFavoriteGenre,
  
};
