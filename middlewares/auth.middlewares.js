import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { User } from "../models/user.models.js";

// token for authenticated user
const generateAccessToken = (id) => {
  if (!id) throw new Error("User ID is required to generate access token");
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (id) => {
  if (!id) throw new Error("User ID is required to generate refresh token");
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};


const generateVerifyToken = (id) => {
  if (!id) throw new Error("User ID is required to generate verification token");
  return jwt.sign({ id }, process.env.VERIFY_TOKEN_SECRET, {
    expiresIn: process.env.VERIFY_TOKEN_EXPIRY,
  });
};


const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// New middleware: verify access Token
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify the access token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Attach user to the request object (excluding the password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error(error);

      // Handle expired token case
      if (error.name === 'JsonWebTokenError') {
        res.status(403);
        throw new Error('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        try {
          // Use refresh token to get a new access token (this will need to be implemented)
          const newAccessToken = await refreshToken(req, res); // Implement this function to get new access token
          req.headers.authorization = `Bearer ${newAccessToken}`;
          next();
        } catch (refreshError) {
          res.status(403);
          throw new Error('Failed to refresh token');
        }
      } else {
        res.status(500);
        throw new Error('Error verifying token');
      }
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('No token provided');
  }
});



//protection middleware
const protectRoute = asyncHandler(async (req, res, next) => {
  let token;

  //check if token exists in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // set token from Bearer token header
    try {
      token = req.headers.authorization.split(" ")[1];

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      req.user = await User.findById(decodedToken.id).select("-password");

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed!");
    }
  }

  //if token does not exist in headers
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token!");
  }
});

export { generateAccessToken, protectRoute, generateRefreshToken, generateVerifyToken, verifyRefreshToken, verifyToken };
