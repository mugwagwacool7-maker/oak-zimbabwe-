import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PassCard from "@/components/PassCard";

export default async function PassPage({ params }: PageProps<"/pass/[token]">) {
  const { token } = await params;
  const { data: attendee, error } = await supabase
    .from("attendees")
    .select("first_name, last_name, organization, role, qr_token")
    .eq("qr_token", token)
    .single();

  if (error || !attendee) notFound();

  return (
    <div className="max-w-sm mx-auto mt-12 px-4">
      <PassCard
        firstName={attendee.first_name}
        lastName={attendee.last_name}
        organization={attendee.organization}
        role={attendee.role}
        token={attendee.qr_token}
      />
    </div>
  );
}
