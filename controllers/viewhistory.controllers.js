import asyncHandler from "express-async-handler";
import {ViewHistory} from "../models/viewHistory.model.js"

// update view history
const updateViewHistory = asyncHandler(async (req, res) => {
  const { id, title, type } = req.body;
  const userId = req.user._id;

  if (!id || !title || !type || !userId) {
    return res.status(400).json({ 
      message: "Missing required fields: id, title, type, or userId" 
    });
  }

  try {
    // Get today's date at midnight for consistent daily records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's record
    let viewHistory = await ViewHistory.findOne({
      userId,
      date: today
    });

    // If no record exists for today, create a new one
    if (!viewHistory) {
      viewHistory = new ViewHistory({
        userId,
        date: today,
        tvShowsViewed: 0,
        moviesViewed: 0,
        totalViewed: 0,
        viewedMediaIds: []
      });
    }

    // Check if this media has already been viewed today
    const alreadyViewed = viewHistory.viewedMediaIds.some(
      item => item.mediaId === id && item.mediaType === type
    );

    // Only increment if it hasn't been viewed today
    if (!alreadyViewed) {
      // Add to viewed media list
      viewHistory.viewedMediaIds.push({
        mediaId: id,
        mediaType: type
      });

      // Increment appropriate counter
      if (type === 'tv') {
        viewHistory.tvShowsViewed += 1;
      } else if (type === 'movie') {
        viewHistory.moviesViewed += 1;
      }

      // Update total
      viewHistory.totalViewed = viewHistory.tvShowsViewed + viewHistory.moviesViewed;

      // Save changes
      await viewHistory.save();

      return res.status(200).json({
        message: "View tracked successfully",
        viewHistory: {
          tvShowsViewed: viewHistory.tvShowsViewed,
          moviesViewed: viewHistory.moviesViewed,
          totalViewed: viewHistory.totalViewed
        }
      });
    } else {
      // If already viewed, just return current counts
      return res.status(200).json({
        message: "Media already viewed today",
        viewHistory: {
          tvShowsViewed: viewHistory.tvShowsViewed,
          moviesViewed: viewHistory.moviesViewed,
          totalViewed: viewHistory.totalViewed
        }
      });
    }

  } catch (error) {
    console.error("Error tracking view:", error);
    return res.status(500).json({ message: "Failed to track view" });
  }
});

// Get view history for charts
const getViewHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const days = parseInt(req.query.days).toString() || 7; // Default to 7 days

  try {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const viewHistory = await ViewHistory.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    // Format data for charts
    const chartData = viewHistory.map(record => ({
      date: record.date.toISOString().split('T')[0],
      tvShows: record.tvShowsViewed,
      movies: record.moviesViewed,
      total: record.totalViewed
    }));

    return res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching view history:", error);
    return res.status(500).json({ message: "Failed to fetch view history" });
  }
});

// Get today's viewing statistics
const getTodayStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's record
    const todayStats = await ViewHistory.findOne({
      userId,
      date: today
    });

    // If no record exists for today, return zeros
    if (!todayStats) {
      return res.status(200).json({
        tvShowsViewed: 0,
        moviesViewed: 0,
        totalViewed: 0
      });
    }

    // Return today's stats
    return res.status(200).json({
      tvShowsViewed: todayStats.tvShowsViewed,
      moviesViewed: todayStats.moviesViewed,
      totalViewed: todayStats.totalViewed
    });

  } catch (error) {
    console.error("Error fetching today's stats:", error);
    return res.status(500).json({ message: "Failed to fetch today's viewing statistics" });
  }
});

export { updateViewHistory, getViewHistory, getTodayStats };
