import mongoose, { Schema, models } from "mongoose"

export interface ISearchHistory {
  _id: string
  userId: string
  query: string
  criteria: Array<{
    id: string
    name: string
    description: string
  }>
  results: any
  model: string
  fallbackModel?: string
  status: "success" | "error"
  sizeKB: number
  timestamp: Date
}

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    query: {
      type: String,
      required: [true, "Query is required"],
      trim: true,
    },
    criteria: {
      type: [
        {
          id: String,
          name: String,
          description: String,
        },
      ],
      default: [],
    },
    results: {
      type: Schema.Types.Mixed,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    fallbackModel: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["success", "error"],
      default: "success",
    },
    sizeKB: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
searchHistorySchema.index({ userId: 1, timestamp: -1 })
searchHistorySchema.index({ userId: 1, query: 1 })

const SearchHistory = models.SearchHistory || mongoose.model<ISearchHistory>("SearchHistory", searchHistorySchema)

export default SearchHistory
