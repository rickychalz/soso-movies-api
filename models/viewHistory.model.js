import mongoose, { Schema } from "mongoose";

const viewHistorySchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  date: { type: Date, required: true },
  tvShowsViewed: { type: Number, default: 0 },
  moviesViewed: { type: Number, default: 0 },
  totalViewed: { type: Number, default: 0 },
  // Track unique media IDs to prevent duplicate counting
  viewedMediaIds: [{
    mediaId: { type: Number, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true }
  }]
});

// Compound index for efficient queries
viewHistorySchema.index({ userId: 1, date: 1 });

export const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema);


