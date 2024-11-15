import { Router } from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  changePassword,
  logoutUser
} from "../controllers/user.controllers.js";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from "../controllers/watchlist.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { protectRoute , verifyToken} from "../middlewares/auth.middlewares.js";

const router = Router();

//Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

//Private Routes
router.use(verifyToken);
router.put("/", protectRoute, updateUserProfile);
router.delete("/", protectRoute, deleteUser);
router.put("/password", protectRoute, changePassword);
router.post("/logout", protectRoute, logoutUser)
router.post("/add-to-wishlist", protectRoute, addToWatchlist)
router.get("/get-watchlist", protectRoute, getWatchlist)
router.delete("/remove-from-watchlist", protectRoute, removeFromWatchlist)

export default router;
