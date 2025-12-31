import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        try {
          await dbConnect()
          const user = await User.findOne({ email: credentials.email })

          if (!user) {
            throw new Error("User not found")
          }

          if (!user.password) {
            throw new Error("Please sign in with the provider you used to create your account")
          }

          const isValidPassword = await bcrypt.compare(credentials.password as string, user.password)

          if (!isValidPassword) {
            throw new Error("Invalid password")
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error
          }
          throw new Error("Authentication failed")
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await dbConnect()
          let existingUser = await User.findOne({ email: user.email })

          if (!existingUser) {
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
            })
          }

          user.id = existingUser._id.toString()
        } catch (error) {
          console.error("Error creating user:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      } else if (account?.provider === "credentials" && !token.id) {
        try {
          await dbConnect()
          const dbUser = await User.findOne({ email: token.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
          }
        } catch (error) {
          console.error("Error fetching user for token:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})

export async function registerUser(name: string, email: string, password: string) {
  try {
    await dbConnect()

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      throw new Error("User already exists")
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "credentials",
    })

    return {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to register user")
  }
}
