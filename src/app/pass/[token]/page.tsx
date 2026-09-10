"use client";
import React, { useRef, useState } from "react";

const QR_MATRIX = [
  "111111101001001111111",
  "100000100101001000001",
  "101110101010101011101",
  "101110100010001011101",
  "101110101101101011101",
  "100000100100101000001",
  "111111101010101111111",
  "000000001001000000000",
  "101101110110111010110",
  "010010001010010101001",
  "111011101101101110110",
  "001001000100001001010",
  "100110111011110110001",
  "000000001001010010010",
  "111111100110101001101",
  "100000101000010100010",
  "101110100111101011001",
  "101110101000110101010",
  "101110100101001010101",
  "100000101011010001001",
  "111111100100111010010",
];

const OAK_LOGO_BASE64 =
  "data:image/png;base64,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";

const REGISTRATION_DETAILS = [
  { label: "Name", value: "tinashe smith" },
  { label: "Organisation", value: "uncommon.org" },
  { label: "Role", value: "Partner" },
  { label: "Email", value: "tinasheuncommon.org" },
  { label: "Event Dates", value: "9–11 March 2026" },
  { label: "Location", value: "Harare, Zimbabwe" },
];

export default function RegistrationCompletePage() {
  const [activeTab, setActiveTab] = useState<"register" | "programme" | "partners">("register");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const downloadQRCode = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    canvas.width = 1000;
    canvas.height = 1000;
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.drawImage(img, 100, 100, 800, 800);
      const a = document.createElement("a");
      a.download = "OAK-2026-7842-XKPH.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + window.btoa(svgData);
  };

  const handleRegisterAnother = () => {
    if (confirm("Register another attendee for Partner Convening 2026?")) {
      alert("Ready to register next attendee.");
    }
  };

  return (
    <div className="bg-[#f4f5f7] h-screen w-screen flex m-0 p-0 selection:bg-[#162e55] selection:text-white overflow-hidden text-[#1e293b] font-sans">

      <aside className="w-[135px] h-full bg-white border-r border-[#eaecf0] flex flex-col justify-between flex-shrink-0 select-none">

        <div className="pt-4 pb-2 px-2.5">
          <div className="px-0.5">
            <img
              src={OAK_LOGO_BASE64}
              alt="Oak Foundation"
              className="w-[78px] h-auto object-contain block"
            />
            <div className="text-[7.5px] font-bold tracking-[0.11em] text-[#8292a2] uppercase mt-2 leading-tight">
              Partner Convening 2026
            </div>
          </div>
          <nav className="space-y-0.5 mt-3.5">
            <button
              onClick={() => setActiveTab("register")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-all ${
                activeTab === "register"
                  ? "bg-[#162e55] text-white font-medium shadow-sm"
                  : "text-[#627588] hover:text-[#162e55] hover:bg-slate-50 font-normal"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === "register" ? "text-white" : "text-[#8898a8]"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span className="tracking-wide">Register</span>
            </button>
            <button
              onClick={() => setActiveTab("programme")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-all ${
                activeTab === "programme"
                  ? "bg-[#162e55] text-white font-medium shadow-sm"
                  : "text-[#627588] hover:text-[#162e55] hover:bg-slate-50 font-normal"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === "programme" ? "text-white" : "text-[#8898a8]"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" />
              </svg>
              <span className="tracking-wide">Programme</span>
            </button>
            <button
              onClick={() => setActiveTab("partners")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-all ${
                activeTab === "partners"
                  ? "bg-[#162e55] text-white font-medium shadow-sm"
                  : "text-[#627588] hover:text-[#162e55] hover:bg-slate-50 font-normal"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === "partners" ? "text-white" : "text-[#8898a8]"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="tracking-wide">Partners</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-[#f0f2f5] p-2.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#edf2f6] flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 text-[#8fa2b6]"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-[9px] text-[#1e293b] leading-tight">Harare, Zimbabwe</div>
            <div className="text-[8px] text-[#8fa2b6] leading-tight mt-0.5">9–11 March 2026</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full flex flex-col items-center justify-center px-4 py-2 overflow-hidden">
        <div className="w-full max-w-[349px] flex flex-col gap-2">

          <section
            style={{ background: "radial-gradient(circle at 86% 28%, #254676 0%, #162e55 62%)" }}
            className="text-white rounded-2xl px-4 py-3 shadow-[0_3px_12px_-2px_rgba(22,46,85,0.25)] relative overflow-hidden flex-shrink-0"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-[#274064] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="m8.5 12 2.5 2.5 5-5" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[7.5px] font-semibold tracking-wider text-[#8da2bd] uppercase mb-0.5">REGISTRATION COMPLETE</div>
                <h1 className="text-[17px] font-bold text-white leading-tight tracking-tight">
                  You&apos;re Registered,
                  <br />
                  tinashe!
                </h1>
                <div className="text-[10px] text-[#8da2bd] font-normal mt-0.5">uncommon.org</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl px-4 py-3 border border-[#edf0f3] shadow-[0_1px_4px_rgba(0,0,0,0.02)] text-center flex-shrink-0">
            <h2 className="text-[7.5px] font-bold tracking-[0.14em] text-[#7d90a4] uppercase mb-2">YOUR ENTRY PASS</h2>
            <div className="w-32 h-32 mx-auto bg-[#eef3f7] rounded-2xl p-2 flex items-center justify-center">
              <div className="bg-white w-full h-full rounded-xl p-1.5 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <svg
                  ref={svgRef}
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full select-none"
                >
                  {QR_MATRIX.map((row, r) =>
                    row.split("").map((cell, c) =>
                      cell === "1" ? (
                        <rect
                          key={`${r}-${c}`}
                          x={+(c + 0.08).toFixed(2)}
                          y={+(r + 0.08).toFixed(2)}
                          width={0.84}
                          height={0.84}
                          rx={0.22}
                          fill="#162e55"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="font-mono text-[8.5px] font-semibold tracking-[0.16em] text-[#627588]">OAK-2026-7842-XKPH</div>
              <div className="text-[7.5px] text-[#8e9fae] mt-0.5">Present at event entrance for check-in</div>
            </div>
          </section>

          <section className="bg-white rounded-2xl px-4 py-2.5 border border-[#edf0f3] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex-shrink-0">
            <h2 className="text-[7.5px] font-bold tracking-[0.12em] text-[#7d90a4] uppercase mb-0.5">REGISTRATION DETAILS</h2>
            <div className="divide-y divide-[#f2f4f7] text-[9px]">
              {REGISTRATION_DETAILS.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5">
                  <span className="text-[#8e9fae] font-normal">{item.label}</span>
                  <span className="font-semibold text-[#162e55]">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex-shrink-0">
            <button
              onClick={downloadQRCode}
              className="w-full bg-[#162e55] hover:bg-[#122544] text-white py-2 px-4 rounded-xl font-semibold text-[10.5px] flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(22,46,85,0.2)] transition-all active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download QR Code</span>
            </button>
            <button
              onClick={handleRegisterAnother}
              className="w-full mt-1.5 flex items-center justify-center gap-1 text-[8.5px] text-[#627588] hover:text-[#162e55] font-normal transition-colors cursor-pointer bg-transparent border-0 p-0.5"
            >
              <svg className="w-2.5 h-2.5 text-[#7d90a4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Register another attendee</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
