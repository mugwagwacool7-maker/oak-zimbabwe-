'use client';
import { QRCodeSVG } from "qrcode.react";

export default function PassCard({
  firstName,
  lastName,
  organization,
  role,
  token,
}: {
  firstName: string;
  lastName: string;
  organization: string;
  role: string | null;
  token: string;
}) {
  return (
    <div className="border rounded-xl shadow-sm p-6 text-center space-y-4 bg-white">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          OAK Foundation — Partner Convening 2026
        </p>
        <h2 className="text-xl font-semibold mt-1">{firstName} {lastName}</h2>
        <p className="text-gray-600">{organization}</p>
        {role && <p className="text-sm text-gray-500">{role}</p>}
      </div>
      <div className="flex justify-center">
        <QRCodeSVG value={token} size={200} />
      </div>
      <p className="text-xs text-gray-400">Show this QR code at check-in each day.</p>
    </div>
  );
}
