"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { getSupabase } from "@/lib/supabase";

type AttendeeRow = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  qr_code: string | null;
  accommodation: string | null;
  organization: string | null;
  checked_in: boolean;
  check_in_date: string | null;
  check_in_time: string | null;
};

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const fetchedRef = useRef(false);
  const supabase = getSupabase();

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    const { data: attendeeData, error } = await supabase
      .from("attendees")
      .select(
        `
        id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        qr_code,
        accommodation,
        organization,
        check_ins (
          check_in_date,
          checked_in_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch attendees:", error);
      setLoading(false);
      return;
    }

    const rows: AttendeeRow[] = (attendeeData || []).map((a: Record<string, unknown>) => {
      const checkIns = a.check_ins as Array<{ check_in_date: string; checked_in_at: string }> | null;
      const todayCheckIn = checkIns?.find((c) => c.check_in_date === today);
      const name =
        (a.full_name as string) ||
        `${(a.first_name as string) || ""} ${(a.last_name as string) || ""}`.trim() ||
        "Unknown";

      return {
        id: a.id as string,
        full_name: name,
        first_name: (a.first_name as string) || "",
        last_name: (a.last_name as string) || "",
        email: (a.email as string) || null,
        phone: (a.phone as string) || null,
        qr_code: (a.qr_code as string) || null,
        accommodation: (a.accommodation as string) || null,
        organization: (a.organization as string) || null,
        checked_in: !!todayCheckIn,
        check_in_date: todayCheckIn?.check_in_date || null,
        check_in_time: todayCheckIn?.checked_in_at
          ? new Date(todayCheckIn.checked_in_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : null,
      };
    });

    setAttendees(rows);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchAttendees();
    }
  }, [fetchAttendees]);

  // Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) {
      return attendees;
    }

    const q = search.toLowerCase();
    return attendees.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.qr_code && a.qr_code.toLowerCase().includes(q)) ||
        a.id.toLowerCase().includes(q) ||
        (a.organization && a.organization.toLowerCase().includes(q))
    );
  }, [search, attendees]);

  // CSV Export
  const exportCSV = useCallback(() => {
    setExporting(true);

    const headers = [
      "Name",
      "Email",
      "Accommodation",
      "Check-in Date",
      "Check-in Time",
      "Status",
    ];

    const rows = filtered.map((a) => [
      a.full_name,
      a.email || "",
      a.accommodation || "",
      a.check_in_date || "",
      a.check_in_time || "",
      a.checked_in ? "Checked in" : "Not checked in",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${(cell || "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oak-attendees-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExporting(false);
  }, [filtered]);

  const formatDate = (date: string | null) => {
    if (!date) return "\u2014";
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3A]">
                ATTENDEES
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Search and manage registered attendees
              </p>
            </div>
            <button
              onClick={exportCSV}
              disabled={exporting || filtered.length === 0}
              className="flex items-center gap-2 bg-[#0B1F3A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0B1F3A]/90 transition disabled:opacity-50"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, QR code, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Showing {filtered.length} of {attendees.length} attendees
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#0B1F3A]/20 border-t-[#0B1F3A] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {search
                  ? "No attendees match your search"
                  : "No attendees registered yet"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">
                        Name
                      </th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">
                        Email
                      </th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">
                        Accommodation
                      </th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">
                        Status
                      </th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">
                        Check-in Date
                      </th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">
                        Check-in Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0B1F3A] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {a.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {a.full_name}
                              </p>
                              {a.organization && (
                                <p className="text-[11px] text-gray-400">
                                  {a.organization}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {a.email || "\u2014"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {a.accommodation || "\u2014"}
                        </td>
                        <td className="px-5 py-3">
                          {a.checked_in ? (
                            <span className="bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                              Checked in
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                              Not checked in
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {formatDate(a.check_in_date)}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {a.check_in_time || "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
