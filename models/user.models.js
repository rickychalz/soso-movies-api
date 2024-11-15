import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      trim: true,
      minlength: [3, "Username must be atleast 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be atleast 6 characters"]
    },
    avatar: {
      type: String,
      default: null,
    },
    favoriteGenres: [
      {
        type: String,
      },
    ],
    likedMovies: [
      {
        type: String,
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    socialLogin: {
      provider: {
        type: String,
        enum: ["google", "facebook"],
      },
      providerId: String,
    },
    refreshToken: String,
    accessToken: String,
  },
  {
    timestamps: true,
  }
);


export const User = mongoose.model("User", userSchema);
