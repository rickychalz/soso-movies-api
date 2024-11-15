import mongoose,{ Schema } from 'mongoose'


const viewHistorySchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    movieId: {
      type: String,
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number,
      min: 0
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  });

  export const ViewHistory = mongoose.model("ViewHistory", viewHistorySchema);