import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const users: Array<{ id: string; name: string; email: string; password: string }> = []

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        const user = users.find((u) => u.email === credentials.email)

        if (!user) {
          throw new Error("User not found")
        }

        const isValidPassword = await bcrypt.compare(credentials.password as string, user.password)

        if (!isValidPassword) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
  },
  session: {
    strategy: "jwt",
  },
})

export async function registerUser(name: string, email: string, password: string) {
  const existingUser = users.find((u) => u.email === email)

  if (existingUser) {
    throw new Error("User already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = {
    id: String(users.length + 1),
    name,
    email,
    password: hashedPassword,
  }

  users.push(newUser)
  return { id: newUser.id, name: newUser.name, email: newUser.email }
}
