"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"

export default function Dashboard() {
  const router = useRouter()
  const [client] = useState(() => createClient())
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data } = await client.auth.getUser()
      if (!data.user) {
        router.push("/login")
        return
      }
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [client, router])

  async function handleLogout() {
    await client.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center">Loading...</div>
  }

  if (!user) return null

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <h1 className="text-xl font-bold">OAK Zimbabwe Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Logout
        </button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600">Welcome, {user.email}</p>
        <p className="text-sm text-gray-500">
          You are logged in and authenticated.
        </p>
      </main>
    </div>
  )
}
