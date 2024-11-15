const likedMoviesSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    movieId: {
      type: String,
      required: true
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  });

  export const LikedMovies = mongoose.model("LikedMovies", likedMoviesSchema);