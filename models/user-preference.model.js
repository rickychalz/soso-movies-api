import mongoose, {Schema} from 'mongoose'

const userPreferencesSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    contentFilters: {
      minRating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      },
      excludedGenres: [{
        type: String
      }]
    }
  });


  export const UserPreference = mongoose.model("UserPreference", userPreferenceSchema);