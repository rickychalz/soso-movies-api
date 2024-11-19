import { Router } from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  changePassword,
  logoutUser,
  verifyEmail,
  googleLogin,
  addFavoriteGenres,
  deleteFavoriteGenre,
  getFavoriteGenres,

} from "../controllers/user.controllers.js";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getWatchlistCount,
} from "../controllers/watchlist.controllers.js";

import { protectRoute, verifyToken } from "../middlewares/auth.middlewares.js";
import {
  updateViewHistory,
  getViewHistory,
  getTodayStats,
} from "../controllers/viewhistory.controllers.js";
import multerConfig from "../middlewares/multer.middlewares.js";
const { upload, processImage } = multerConfig;

const router = Router();

//Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post('/google-login', googleLogin);
router.get("/verify-email", verifyEmail);



//Private Routes
router.use(verifyToken);
router.put(
  "/update-profile",
  protectRoute,
  upload.single("avatar"),
  processImage,
  updateUserProfile
);

router.delete("/delete-user", protectRoute, deleteUser);
router.put("/change-password", protectRoute, changePassword);
router.post("/logout", protectRoute, logoutUser);
router.post("/add-to-watchlist", protectRoute, addToWatchlist);
router.get("/get-watchlist", protectRoute, getWatchlist);
router.get("/get-watchlist-count", protectRoute, getWatchlistCount);
router.delete(
  "/remove-from-watchlist/:movieId",
  protectRoute,
  removeFromWatchlist
);
router.post("/update-views", protectRoute, updateViewHistory);
router.get("/view-history", protectRoute, getViewHistory);
router.get("/today-stats", protectRoute, getTodayStats);
router.post("/add-favorite-genres", protectRoute, addFavoriteGenres);
router.get('/get-favorite-genres', protectRoute, getFavoriteGenres);
router.delete('/delete-favorite-genre', protectRoute, deleteFavoriteGenre);


export default router;
