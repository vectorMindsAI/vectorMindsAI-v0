import mongoose from "mongoose"
import * as Sentry from "@sentry/nextjs"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI && process.env.NODE_ENV !== 'production') {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

const isBuildTime = MONGODB_URI?.includes('build-dummy')

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (isBuildTime) {
    console.log('Skipping MongoDB connection during build time')
    return null as any
  }
  
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise
    console.log('MongoDB connected successfully')
  } catch (e) {
    cached.promise = null
    console.error('❌ MongoDB connection error:', e)
    
    Sentry.captureException(e, {
      tags: {
        component: 'mongodb',
        action: 'connection',
      },
      extra: {
        mongoUri: MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
      },
    })
    
    throw new Error(`Failed to connect to MongoDB: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return cached.conn
}

export default dbConnect
