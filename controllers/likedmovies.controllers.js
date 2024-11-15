import asyncHandler from "express-async-handler";
import { LikedMovies } from "../models/liked-movies.model.js";

//add to liked movies
const addLikedMovies = asyncHandler(async (req, res) => {
    const { movieId } = req.body;
    const userId = req.user._id;
  
    try {
      // Check if the movie is already liked by the user
      const existingLike = await LikedMovies.findOne({
        user: userId,
        movie: movieId
      });
  
      // If movie is already liked, remove it
      if (existingLike) {
        
        
        return res.status(400).json({
          message: "Movie removed from liked",
        });
      }
  
      // If movie isn't liked, create new like
      const newLike = await LikedMovies.create({
        user: userId,
        movie: movieId,
        likedAt: new Date()
      });
  
      // Return the updated likes
      const userLikes = await LikedMovies.find({ user: userId })
        .sort({ likedAt: -1 })
        .select('movie likedAt');
  
      res.status(200).json({
        message: "Movie added to liked",
        isLiked: true,
        likes: userLikes
      });
  
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

//remove from liked movies
const removeLikedMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params; // Get movieId from URL params
    const userId = req.user._id;
  
    try {
      // Find and delete the liked movie entry
      const removedMovie = await LikedMovies.findOneAndDelete({
        user: userId,
        movie: movieId
      });
  
      // If movie wasn't found in liked list
      if (!removedMovie) {
        return res.status(404).json({
          success: false,
          message: "Movie not found in liked list"
        });
      }
  
      // Get updated list of liked movies
      const updatedLikes = await LikedMovies.find({ user: userId })
        .sort({ likedAt: -1 })
        .select('movie likedAt');
  
      res.status(200).json({
        success: true,
        message: "Movie removed from liked list",
        likes: updatedLikes
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error removing movie from liked list",
        error: error.message
      });
    }
  });
  
// get user's liked movies
const getLikedMovies = asyncHandler(async (req, res) => {
    try {
      const userLikes = await LikedMovies.find({ user: req.user._id })
        .sort({ likedAt: -1 })
        .select('movie likedAt');
  
      res.status(200).json(userLikes);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
//check if a movie is liked
const isMovieLiked = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    
    try {
      const liked = await LikedMovies.findOne({
        user: req.user._id,
        movie: movieId
      });
  
      res.status(200).json({ isLiked: !!liked });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });




  export{
    addLikedMovies,
    removeLikedMovie,
    getLikedMovies,
  }