import mongoose from "mongoose"
import { logServerInfo, logServerError } from "./logger"

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://build-dummy:27017/test'

const isBuildTime = MONGODB_URI?.includes('build-dummy')

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongooseCache: MongooseCache | undefined
}

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null }
}

const cached = global._mongooseCache

async function dbConnect() {
  if (isBuildTime) {
    logServerInfo('Skipping MongoDB connection during build time')
    return null as unknown as typeof mongoose
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    })
  }

  try {
    cached.conn = await cached.promise
    logServerInfo('MongoDB connected successfully')
  } catch (e) {
    cached.promise = null
    logServerError('MongoDB connection error', e instanceof Error ? e : new Error(String(e)), {
      component: 'mongodb',
      mongoUri: MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
    })
    throw new Error(`Failed to connect to MongoDB: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return cached.conn
}

export default dbConnect
