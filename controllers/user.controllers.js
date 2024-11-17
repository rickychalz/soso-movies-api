import asyncHandler from "express-async-handler";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerifyToken,
  verifyRefreshToken,
} from "../middlewares/auth.middlewares.js";
import transporter from "../controllers/nodemailer.js";
import jwt from 'jsonwebtoken';

//registering user
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, avatar } = req.body;

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

    

    // Create user with verification token
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar,
      isEmailVerified: false
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

      res.status(201).json({
        success: true,
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        accessToken,
        message: "Registration successful. Please check your email to verify your account."
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

    res.status(200).json({
      success: true,
      message: "Email successfully verified! You can now log in."
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(400);
    throw new Error("Invalid or expired token.");
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
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        try {
          await fs.access(oldAvatarPath);
          await fs.unlink(oldAvatarPath);
        } catch (error) {
          console.log('No old avatar file to delete');
        }
      }

      // Update avatar path in database
      // Store relative path from uploads directory
      user.avatar = req.file.path.replace('uploads/', '');
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

export {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  changePassword,
  refreshToken,
  verifyEmail,
  logoutUser,
};
