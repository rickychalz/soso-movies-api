import mongoose, {Schema} from 'mongoose'


const watchlistSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    movieId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['plan_to_watch', 'watching', 'completed'],
      default: 'plan_to_watch'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  });

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);