import { Router } from "express";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from "../controllers/watchlist.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { protectRoute , verifyToken} from "../middlewares/auth.middlewares.js";

const router = Router();

//Private Routes
router.post("/add-to-watchlist", protectRoute, addToWatchlist)
router.get("/get-watchlist", protectRoute, getWatchlist)
router.delete("/remove-from-watchlist", protectRoute, removeFromWatchlist)

export default router;
