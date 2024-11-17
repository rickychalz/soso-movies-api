import asyncHandler from "express-async-handler";
import { ViewHistory } from "../models/viewHistory.model.js";

const updateViewHistory = asyncHandler(async (req, res) => {
  const { userId, tvShowsViewed, moviesViewed } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the date to midnight today

    // Check if the user activity for today already exists
    let viewHistory = await ViewHistory.findOne({
      userId,
      date: { $gte: today, $lt: new Date(today).setDate(today.getDate() + 1) }, // activity within today
    });

    if (viewHistory) {
      // If activity exists, update the view counts
      viewHistory.tvShowsViewed += tvShowsViewed;
      viewHistory.moviesViewed += moviesViewed;
    } else {
      // If no activity for today, create a new entry
      viewHistory = new ViewHistory({
        userId,
        tvShowsViewed,
        moviesViewed,
        date: today,
      });
    }

    await viewHistory.save();

    // Return success response
    res.status(200).json({ message: "Activity updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating activity", error });
  }
});

const getWeeklyViewHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a parameter

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight today

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7); // Set the date to 7 days ago

    // Query the database for the last 7 days of activity
    const viewHistory = await ViewHistory.find({
      userId,
      date: { $gte: sevenDaysAgo, $lt: today },
    }).sort({ date: 1 }); // Sort by date ascending

    // Group the data by day (daily totals of tvShowsViewed and moviesViewed)
    const dailyData = {};

    viewHistory.forEach((history) => {
      const dateKey = history.date.toISOString().split("T")[0]; // Format date as 'YYYY-MM-DD'
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { tvShowsViewed: 0, moviesViewed: 0 };
      }
      dailyData[dateKey].tvShowsViewed += history.tvShowsViewed;
      dailyData[dateKey].moviesViewed += history.moviesViewed;
    });

    // Prepare data for the frontend (graph)
    const graphData = {
      labels: [],
      tvShowsViewedData: [],
      moviesViewedData: [],
    };

    // Prepare the last 7 days, including days with no activity
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]; // Format date as 'YYYY-MM-DD'

      graphData.labels.push(dateStr);
      const dayData = dailyData[dateStr] || {
        tvShowsViewed: 0,
        moviesViewed: 0,
      };

      graphData.tvShowsViewedData.push(dayData.tvShowsViewed);
      graphData.moviesViewedData.push(dayData.moviesViewed);
    }

    // Return the formatted data as a JSON response
    res.status(200).json(graphData);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving view history", error });
  }
});

const getTotalViewCount = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a parameter

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight today (00:00:00)

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set to the start of tomorrow (00:00:00)

    // Convert to UTC to avoid timezone issues
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const tomorrowUTC = new Date(Date.UTC(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));

    // Query the database for today's view history
    const viewHistory = await ViewHistory.aggregate([
      { 
        $match: {
          userId,
          date: { $gte: todayUTC, $lt: tomorrowUTC } // Activity within today
        }
      },
      { 
        $group: { 
          _id: null, 
          totalTvShowsViewed: { $sum: "$tvShowsViewed" },
          totalMoviesViewed: { $sum: "$moviesViewed" }
        }
      }
    ]);

    if (viewHistory.length === 0) {
      return res.status(404).json({ message: "No activity found for today." });
    }

    const { totalTvShowsViewed, totalMoviesViewed } = viewHistory[0];

    // Return the total count as a response
    res.status(200).json({
      totalViews: totalTvShowsViewed + totalMoviesViewed,
      tvShowsViewed: totalTvShowsViewed,
      moviesViewed: totalMoviesViewed,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving total view count", error });
  }
});

const getTvShowViewCount = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a parameter

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set to the start of tomorrow

    // Query the database for today's TV show views
    const viewHistory = await ViewHistory.aggregate([
      { 
        $match: {
          userId,
          date: { $gte: today, $lt: tomorrow } // Activity within today
        }
      },
      { 
        $group: { 
          _id: null, 
          totalTvShowsViewed: { $sum: "$tvShowsViewed" }
        }
      }
    ]);

    if (viewHistory.length === 0) {
      return res.status(404).json({ message: "No TV show activity found for today." });
    }

    const { totalTvShowsViewed } = viewHistory[0];

    // Return the total TV show views as a response
    res.status(200).json({
      tvShowsViewed: totalTvShowsViewed,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving TV show view count", error });
  }
});

const getMovieViewCount = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a parameter

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set to the start of tomorrow

    // Query the database for today's movie views
    const viewHistory = await ViewHistory.aggregate([
      { 
        $match: {
          userId,
          date: { $gte: today, $lt: tomorrow } // Activity within today
        }
      },
      { 
        $group: { 
          _id: null, 
          totalMoviesViewed: { $sum: "$moviesViewed" }
        }
      }
    ]);

    if (viewHistory.length === 0) {
      return res.status(404).json({ message: "No movie activity found for today." });
    }

    const { totalMoviesViewed } = viewHistory[0];

    // Return the total movie views as a response
    res.status(200).json({
      moviesViewed: totalMoviesViewed,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving movie view count", error });
  }
});

export { updateViewHistory, getWeeklyViewHistory, getTotalViewCount, getTvShowViewCount, getMovieViewCount };


