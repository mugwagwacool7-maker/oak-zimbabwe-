"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabase();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Verify user is an admin
    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .single();

    if (adminError || !adminRecord) {
      await supabase.auth.signOut();
      setError("You do not have admin access.");
      setLoading(false);
      return;
    }

    router.push("/admin/checkin");
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-bold text-[#0B1F3A]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              OAK Foundation
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mt-1">
              Admin Login
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#0B1F3A] mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="admin@oakfoundation.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#0B1F3A] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B1F3A] text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50 hover:bg-[#0B1F3A]/90 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          OAK Foundation Partner Convening 2026
        </p>
      </div>
    </div>
  );
}
