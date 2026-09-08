import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// GET all profiles (READ)
export async function GET() {
  const { data, error } = await supabaseAdmin.from("profiles").select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profiles: data })
}

// POST create a profile (CREATE)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // --- Validation ---
    const { email, full_name } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 })
    }
    if (!full_name || typeof full_name !== "string") {
      return NextResponse.json({ error: "full_name is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert([{ email, full_name }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}
