import { registerUser } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { logServerInfo, logServerError, logServerWarn } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      logServerWarn('Signup attempt with missing fields', { hasName: !!name, hasEmail: !!email, hasPassword: !!password });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      logServerWarn('Signup attempt with weak password', { email, passwordLength: password.length });
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const user = await registerUser(name, email, password)
    logServerInfo('User registered successfully', { userId: user.id, email });
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    logServerError('User registration failed', error, { endpoint: '/api/auth/signup' });

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
