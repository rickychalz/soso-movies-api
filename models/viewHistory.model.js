import mongoose, { Schema } from "mongoose";

const viewHistorySchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  date: { type: Date, default: Date.now },
  tvShowsViewed: { type: Number, default: 0 },
  moviesViewed: { type: Number, default: 0 },
});


export const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema);


