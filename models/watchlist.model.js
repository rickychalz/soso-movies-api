import mongoose, { Schema } from "mongoose";

const watchlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaId: {  // This will be the movie or TV show ID
      type: String,
      required: true,
    },
    mediaTitle: {  // The title of the movie or TV show
      type: String,
      required: true,
    },
    posterPath: {  // The poster image URL
      type: String,
      required: true,
    },
    mediaType: {  // 'movie' or 'tv' to differentiate between movie and TV show
      type: String,
      enum: ['movie', 'tv'],
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);
