"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HeadcountBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from("check_ins")
        .select("*", { count: "exact", head: true })
        .eq("check_in_date", today);
      setCount(count ?? 0);
    }
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return <div className="text-2xl font-bold">{count ?? "…"} checked in today</div>;
}
