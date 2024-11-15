import mongoose, {Schema} from 'mongoose'

const movieSchema = new Schema({
    tmdbId: {
      type: Number,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    releaseDate: {
      type: Date,
      required: true
    },
    genres: [{
      type: String,
      required: true
    }],
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    posterPath: {
      type: String,
      required: true
    },
    overview: String,
    popularity: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  });

  export const Movie = mongoose.model("Movie", movieSchema);