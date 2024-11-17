import { Router } from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  changePassword,
  logoutUser,
  verifyEmail
} from "../controllers/user.controllers.js";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getWatchlistCount,
} from "../controllers/watchlist.controllers.js";

import { protectRoute , verifyToken} from "../middlewares/auth.middlewares.js";
import { getMovieViewCount, getTotalViewCount, getTvShowViewCount, updateViewHistory } from "../controllers/viewhistory.controllers.js";
import { upload, processImage } from "../middlewares/multer.middlewares.js";

const router = Router();

//Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);

//Private Routes
router.use(verifyToken);
router.put("/update-profile", protectRoute, upload.single('avatar'), processImage, updateUserProfile);
router.delete("/delete-user", protectRoute, deleteUser);
router.put("/change-password", protectRoute, changePassword);
router.post("/logout", protectRoute, logoutUser)
router.post("/add-to-watchlist", protectRoute, addToWatchlist)
router.get("/get-watchlist", protectRoute, getWatchlist)
router.get("/get-watchlist-count", protectRoute, getWatchlistCount)
router.delete("/remove-from-watchlist/:movieId", protectRoute, removeFromWatchlist);
router.post("/update-views", protectRoute, updateViewHistory)
router.get("/get-total-history-count",protectRoute, getTotalViewCount)
router.get("/get-total-tvshow-count",protectRoute, getTvShowViewCount)
router.get("/get-total-movie-count",protectRoute, getMovieViewCount)

export default router;
