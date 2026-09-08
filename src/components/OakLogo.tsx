export default function OakLogo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const big = size === 'lg';
  return (
    <div className="select-none">
      <div className="flex items-baseline" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <span className={`relative inline-block ${big ? 'text-6xl' : 'text-2xl'} font-normal text-[#1B3A6B]`}>
          <span className="relative">
            O
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-70" style={{ mixBlendMode: 'multiply' }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke="#2E5C99" strokeWidth="2" />
              <ellipse cx="50" cy="50" rx="20" ry="44" fill="none" stroke="#2E5C99" strokeWidth="1.5" />
              <line x1="6" y1="50" x2="94" y2="50" stroke="#2E5C99" strokeWidth="1.5" />
              <path d="M10,32 Q50,45 90,32" fill="none" stroke="#2E5C99" strokeWidth="1.5" />
              <path d="M10,68 Q50,55 90,68" fill="none" stroke="#2E5C99" strokeWidth="1.5" />
            </svg>
          </span>
        </span>
        <span className={`${big ? 'text-6xl' : 'text-2xl'} font-normal text-[#1B3A6B] tracking-tight`}>AK</span>
      </div>
      <p className={`${big ? 'text-lg' : 'text-xs'} tracking-[0.35em] text-[#1B3A6B] mt-1`} style={{ fontFamily: 'Georgia, serif' }}>
        FOUNDATION
      </p>
    </div>
  );
}
