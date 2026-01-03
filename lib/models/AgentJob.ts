import mongoose, { Schema, models } from "mongoose"

export interface IAgentJob {
  _id: string
  jobId: string
  userId?: string
  plan: Array<{
    step: string
    description: string
    [key: string]: any
  }>
  status: "pending" | "queued" | "processing" | "waiting_for_selection" | "completed" | "failed"
  progress: number
  logs: Array<{
    type: string
    message: string
    timestamp: number
  }>
  result: any
  candidateLinks?: Array<{
    url: string
    title: string
    snippet: string
  }>
  error?: string
  createdAt: Date
  updatedAt: Date
}

const agentJobSchema = new Schema<IAgentJob>(
  {
    jobId: {
      type: String,
      required: [true, "Job ID is required"],
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    plan: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "queued", "processing", "waiting_for_selection", "completed", "failed"],
      default: "pending",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    logs: {
      type: [
        {
          type: String,
          message: String,
          timestamp: Number,
        },
      ],
      default: [],
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    candidateLinks: {
      type: [
        {
          url: String,
          title: String,
          snippet: String,
        },
      ],
      default: [],
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

agentJobSchema.index({ userId: 1, createdAt: -1 })
agentJobSchema.index({ status: 1, createdAt: -1 })

const AgentJob = models.AgentJob || mongoose.model<IAgentJob>("AgentJob", agentJobSchema)

export default AgentJob
