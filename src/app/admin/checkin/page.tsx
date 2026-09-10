"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import Sidebar from "@/components/Sidebar";
import { getSupabase } from "@/lib/supabase";

type CheckInResult = {
  status: "success" | "duplicate" | "notfound" | "error";
  name?: string;
  organization?: string;
  accommodation?: string;
  message: string;
};

type Headcount = {
  total: number;
  checkedIn: number;
  remaining: number;
};

type RecentCheckIn = {
  id: string;
  checked_in_at: string;
  attendee: {
    full_name: string;
    first_name: string;
    last_name: string;
    accommodation: string | null;
    email: string | null;
  };
};

export default function CheckInPage() {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [headcount, setHeadcount] = useState<Headcount>({
    total: 0,
    checkedIn: 0,
    remaining: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);
  const busyRef = useRef(false);

  const supabase = getSupabase();

  // Fetch headcount
  const fetchHeadcount = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const { count: total } = await supabase
      .from("attendees")
      .select("id", { count: "exact", head: true });

    const { count: checkedIn } = await supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("check_in_date", today);

    const totalNum = total ?? 0;
    const checkedInNum = checkedIn ?? 0;

    setHeadcount({
      total: totalNum,
      checkedIn: checkedInNum,
      remaining: totalNum - checkedInNum,
    });
  }, [supabase]);

  // Fetch recent check-ins
  const fetchRecentCheckIns = useCallback(async () => {
    const { data } = await supabase
      .from("check_ins")
      .select(
        `
        id,
        checked_in_at,
        attendee:attendees (
          full_name,
          first_name,
          last_name,
          accommodation,
          email
        )
      `
      )
      .order("checked_in_at", { ascending: false })
      .limit(10);

    if (data) {
      setRecentCheckIns(data as unknown as RecentCheckIn[]);
    }
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchHeadcount();
      fetchRecentCheckIns();
    }
  }, [fetchHeadcount, fetchRecentCheckIns]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("check_ins_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "check_ins" },
        () => {
          fetchHeadcount();
          fetchRecentCheckIns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHeadcount, fetchRecentCheckIns]);

  // Process a scanned code
  const processCode = useCallback(
    async (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setResult(null);

      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }

      try {
        // Find attendee by qr_code
        const { data: attendee, error: findErr } = await supabase
          .from("attendees")
          .select("id, full_name, first_name, last_name, organization, accommodation")
          .eq("qr_code", code)
          .single();

        if (findErr || !attendee) {
          setResult({
            status: "notfound",
            message: "Attendee not found",
          });
          return;
        }

        const name =
          attendee.full_name ||
          `${attendee.first_name ?? ""} ${attendee.last_name ?? ""}`.trim() ||
          "Unknown";

        // Call RPC
        const { data: rpcResult, error: rpcErr } = await supabase.rpc(
          "check_in_attendee",
          { p_attendee_id: attendee.id }
        );

        if (rpcErr) {
          setResult({
            status: "error",
            name,
            message: rpcErr.message || "Check-in failed",
          });
          return;
        }

        const resultData = rpcResult as {
          success: boolean;
          message: string;
        };

        if (resultData.success) {
          setResult({
            status: "success",
            name,
            organization: attendee.organization,
            accommodation: attendee.accommodation,
            message: "Check-in successful",
          });
          fetchHeadcount();
          fetchRecentCheckIns();
        } else {
          setResult({
            status:
              resultData.message === "Already checked in today"
                ? "duplicate"
                : "notfound",
            name,
            organization: attendee.organization,
            accommodation: attendee.accommodation,
            message: resultData.message,
          });
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
        resultTimeoutRef.current = setTimeout(() => setResult(null), 5000);
      }
    },
    [supabase, fetchHeadcount, fetchRecentCheckIns]
  );

  // Initialize camera scanner
  const startScanner = useCallback(async () => {
    setCameraError(null);

    try {
      const html5Qrcode = new Html5Qrcode("qr-scanner-region");
      scannerRef.current = html5Qrcode;

      const cameraDevices = await Html5Qrcode.getCameras();
      if (!cameraDevices || cameraDevices.length === 0) {
        setCameraError("No cameras found on this device.");
        return;
      }

      setDevices(cameraDevices);

      // Prefer back camera
      const backCamera = cameraDevices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
      );
      const deviceId = selectedDevice || backCamera?.id || cameraDevices[0].id;

      await html5Qrcode.start(
        deviceId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processCode(decodedText);
        },
        () => {}
      );

      setScannerActive(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Camera access failed";
      if (
        message.includes("NotAllowedError") ||
        message.includes("Permission")
      ) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings and try again."
        );
      } else if (
        message.includes("NotFoundError") ||
        message.includes("DevicesNotFound")
      ) {
        setCameraError("No camera found. Use manual code entry instead.");
      } else {
        setCameraError(`Camera error: ${message}. Use manual code entry.`);
      }
    }
  }, [selectedDevice, processCode]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
      setScannerActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, []);

  // Handle manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processCode(manualCode.trim());
    }
  };

  // Toggle scanner
  const toggleScanner = () => {
    if (scannerActive) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const resultColor = {
    success: "bg-green-50 border-green-200 text-green-800",
    duplicate: "bg-amber-50 border-amber-200 text-amber-800",
    notfound: "bg-red-50 border-red-200 text-red-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  const resultIcon = {
    success: (
      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    duplicate: (
      <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    notfound: (
      <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };

  return (
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0B1F3A]">
              EVENT CHECK-IN
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Scan an attendee QR code to check them in
            </p>
          </div>

          {/* Headcount Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Total Registered
              </p>
              <p className="text-3xl font-bold text-[#0B1F3A]">
                {headcount.total}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Checked In Today
              </p>
              <p className="text-3xl font-bold text-green-600">
                {headcount.checkedIn}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Remaining
              </p>
              <p className="text-3xl font-bold text-amber-600">
                {headcount.remaining}
              </p>
            </div>
          </div>

          {/* Scanner Card */}
          <div className="bg-[#0B1F3A] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">
                    QR Code Scanner
                  </h2>
                  <p className="text-white/50 text-xs">
                    Point camera at attendee QR code
                  </p>
                </div>
              </div>
              <button
                onClick={toggleScanner}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  scannerActive
                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {scannerActive ? "Stop Scanner" : "Start Scanner"}
              </button>
            </div>

            {/* Scanner Area */}
            <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
              <div id="qr-scanner-region" ref={containerRef} className="w-full" />

              {!scannerActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative w-56 h-56">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <rect x="7" y="7" width="10" height="10" rx="1" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-white/30 text-xs mt-4">
                    Click &quot;Start Scanner&quot; to activate camera
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <svg className="w-10 h-10 text-red-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p className="text-red-300 text-sm text-center mb-2">
                    {cameraError}
                  </p>
                  <button
                    onClick={() => {
                      setCameraError(null);
                      startScanner();
                    }}
                    className="text-xs text-white/60 hover:text-white/80 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {scannerActive && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white text-[10px] font-medium">
                      Scanning...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera selector */}
            {devices.length > 1 && (
              <div className="mt-3">
                <select
                  value={selectedDevice || ""}
                  onChange={(e) => {
                    setSelectedDevice(e.target.value);
                    if (scannerActive) {
                      stopScanner().then(() => {
                        setTimeout(() => startScanner(), 100);
                      });
                    }
                  }}
                  className="bg-white/10 text-white text-xs rounded-lg px-3 py-2 border border-white/10 w-full"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="text-black">
                      {d.label || `Camera ${d.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Manual Code Entry */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h3 className="text-sm font-semibold text-[#0B1F3A] mb-3">
              Manual Code Entry
            </h3>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter attendee QR code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] font-mono"
              />
              <button
                type="submit"
                disabled={busy || !manualCode.trim()}
                className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0B1F3A]/90 transition disabled:opacity-50"
              >
                {busy ? "Processing..." : "Check In"}
              </button>
            </form>
          </div>

          {/* Check-in Result */}
          {result && (
            <div
              className={`rounded-xl border p-4 mb-6 flex items-center gap-3 ${resultColor[result.status]}`}
            >
              {resultIcon[result.status]}
              <div className="flex-1">
                {result.name && (
                  <p className="font-semibold text-sm">{result.name}</p>
                )}
                {result.organization && (
                  <p className="text-xs opacity-75">{result.organization}</p>
                )}
                {result.accommodation && (
                  <p className="text-xs opacity-75">
                    Accommodation: {result.accommodation}
                  </p>
                )}
                <p className="text-sm font-medium">{result.message}</p>
              </div>
              {result.status === "success" && (
                <span className="bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Checked In
                </span>
              )}
              {result.status === "duplicate" && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Duplicate
                </span>
              )}
            </div>
          )}

          {/* Recent Check-ins */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Recent Check-ins
              </h3>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Live
              </span>
            </div>

            {recentCheckIns.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No check-ins yet today
              </div>
            ) : (
              <div className="space-y-2">
                {recentCheckIns.map((ci) => {
                  const name =
                    ci.attendee?.full_name ||
                    `${ci.attendee?.first_name ?? ""} ${ci.attendee?.last_name ?? ""}`.trim() ||
                    "Unknown";
                  return (
                    <div
                      key={ci.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0B1F3A] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatTime(ci.checked_in_at)}
                          {ci.attendee?.accommodation && (
                            <span className="ml-2">
                              · {ci.attendee.accommodation}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                        Checked In
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
