import asyncHandler from "express-async-handler";
import { Watchlist } from "../models/watchlist.model.js";


const addToWatchlist = asyncHandler(async (req, res) => {
  const { mediaId, mediaTitle, posterPath, mediaType } = req.body;
  const userId = req.user._id;

  try {
    // Check if media (movie or TV show) is already in watchlist
    const existingEntry = await Watchlist.findOne({
      user: userId,
      mediaId: mediaId,
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: `${mediaType === "movie" ? "Movie" : "TV show"} already in watchlist`,
      });
    }

    // Add to watchlist
    const watchlistEntry = await Watchlist.create({
      user: userId,
      mediaId,
      mediaTitle,
      posterPath,
      mediaType,  // Store whether it's a movie or a TV show
    });

    res.status(201).json({
      success: true,
      message: `${mediaType === "movie" ? "Movie" : "TV show"} added to watchlist`,
      data: watchlistEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding to watchlist",
      error: error.message,
    });
  }
});

  // Remove from watchlist
  const removeFromWatchlist = asyncHandler(async (req, res) => {
    const { mediaId } = req.params;
    const userId = req.user._id;
  
    try {
      const removed = await Watchlist.findOneAndDelete({
        user: userId,
        mediaId: mediaId,
      });
  
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: "Media not found in watchlist",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Removed from watchlist",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error removing from watchlist",
        error: error.message,
      });
    }
  });

  // Get user's watchlist
  const getWatchlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
  
    try {
      const watchlist = await Watchlist.find({ user: userId })
        .sort({ createdAt: -1 })  // Ensure the sorting is by `createdAt` or `timestamps`
        .skip((page - 1) * limit)
        .limit(limit);
  
      // Get total count for pagination
      const total = await Watchlist.countDocuments({ user: userId });
  
      res.status(200).json({
        success: true,
        data: watchlist,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching watchlist",
        error: error.message,
      });
    }
  });

  // Check if movie is in watchlist
const checkWatchlist = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const userId = req.user._id;

    try {
      const exists = await Watchlist.findOne({
        user: userId,
        movieId: movieId
      });

      res.status(200).json({
        success: true,
        inWatchlist: !!exists
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking watchlist",
        error: error.message
      });
    }
  })

  const getWatchlistCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
     
      const total = await Watchlist.countDocuments({ user: userId });

      res.status(200).json({
        success: true,
        count: total,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching watchlist",
        error: error.message
      });
    }
  })

  
export {
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    getWatchlistCount,
}