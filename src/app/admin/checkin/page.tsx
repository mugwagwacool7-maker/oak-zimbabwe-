"use client";
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import QrScanner from "@/components/QrScanner";

type Result = {
  status: "success" | "duplicate" | "notfound" | "error";
  name?: string;
  message: string;
};

export default function CheckInPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const handleScan = useCallback(
    async (token: string) => {
      if (busy) return;
      setBusy(true);

      const { data: attendee, error: findErr } = await supabase
        .from("attendees")
        .select("id, first_name, last_name, organization")
        .eq("qr_token", token)
        .single();

      if (findErr || !attendee) {
        setResult({ status: "notfound", message: "QR code not recognized." });
        setBusy(false);
        return;
      }

      const name = `${attendee.first_name ?? ""} ${attendee.last_name ?? ""}`.trim();
      const { error: insertErr } = await supabase
        .from("check_ins")
        .insert({ attendee_id: attendee.id });

      if (insertErr) {
        if (insertErr.code === "23505") {
          setResult({
            status: "duplicate",
            name,
            message: "Already checked in today.",
          });
        } else {
          setResult({ status: "error", message: insertErr.message });
        }
      } else {
        setResult({
          status: "success",
          name,
          message: `Checked in — ${attendee.organization}`,
        });
      }

      setTimeout(() => setBusy(false), 1500);
    },
    [busy]
  );

  return (
    <div className="max-w-sm mx-auto mt-10 space-y-6 text-center">
      <h1 className="text-xl font-semibold">OAK Check-in</h1>
      <QrScanner onScan={handleScan} />
      {result && (
        <div
          className={
            result.status === "success"
              ? "text-green-700"
              : result.status === "duplicate"
                ? "text-amber-600"
                : "text-red-600"
          }
        >
          {result.name && <p className="font-medium">{result.name}</p>}
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
