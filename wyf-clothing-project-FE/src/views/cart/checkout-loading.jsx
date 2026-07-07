import { useEffect, useState, useRef } from "react";

export default function CheckoutLoading({


  onComplete = () => { },
  orderNumber = "WYF-004821",
  redirectSeconds = 4,
}) {

  const [stage, setStage] = useState(0); // 0 drop, 1 stamp, 2 barcode, 3 stitching
  const [count, setCount] = useState(redirectSeconds);
  const firedRef = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 650);
    const t2 = setTimeout(() => setStage(2), 1250);
    const t3 = setTimeout(() => setStage(3), 1750);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (stage < 3) return;
    if (count <= 0) {
      if (!firedRef.current) { firedRef.current = true; onComplete(); }
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, count, onComplete]);

  const progressPct = stage < 3 ? 0 : ((redirectSeconds - count) / redirectSeconds) * 100;

  return (
    <div className="wyf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap');

        .wyf-root {
          --ink: #0a0a0a;
          --bone: #f3f1ea;
          --paper: #ece8dd;
          --line: #c9c4b6;
          --muted: #7a7669;
          --grain: rgba(10,10,10,0.06);
          min-height: 100vh;
          width: 100%;
          background: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          font-family: 'Space Mono', monospace;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }
        .wyf-root *, .wyf-root *::before, .wyf-root *::after { box-sizing: border-box; }

        .wyf-root::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(var(--grain) 1px, transparent 1px);
          background-size: 3px 3px;
          opacity: 0.5;
          pointer-events: none;
          mix-blend-mode: overlay;
        }

        .wyf-bg-word {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Archivo Black', sans-serif;
          font-size: min(22vw, 260px);
          color: transparent;
          -webkit-text-stroke: 1px rgba(243,241,234,0.05);
          letter-spacing: -0.02em;
          white-space: nowrap;
          user-select: none;
          pointer-events: none;
        }

        .wyf-string {
          width: 2px;
          height: 46px;
          background: repeating-linear-gradient(
            to bottom, var(--bone) 0 4px, transparent 4px 8px
          );
          margin: 0 auto;
          opacity: 0;
          animation: wyf-string-in 0.4s ease-out 0.05s forwards;
        }
        @keyframes wyf-string-in {
          from { opacity: 0; height: 0; }
          to   { opacity: 0.85; height: 46px; }
        }
        .wyf-loop {
          width: 22px;
          height: 22px;
          border: 2px solid var(--bone);
          border-radius: 50%;
          margin: 0 auto -12px;
          opacity: 0;
          animation: wyf-fade 0.3s ease-out 0.05s forwards;
        }
        @keyframes wyf-fade { to { opacity: 0.85; } }

        .wyf-tag {
          position: relative;
          width: min(92vw, 380px);
          background: var(--bone);
          border-radius: 14px;
          padding: 30px 28px 26px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.2);
          opacity: 0;
          transform: translateY(-160px) rotate(-14deg);
          animation: wyf-drop 0.85s cubic-bezier(.2,.85,.35,1.15) 0.1s forwards;
        }
        @keyframes wyf-drop {
          0%   { opacity: 0; transform: translateY(-160px) rotate(-14deg); }
          55%  { opacity: 1; transform: translateY(6px) rotate(4deg); }
          75%  { transform: translateY(-3px) rotate(-2deg); }
          100% { opacity: 1; transform: translateY(0) rotate(-1.2deg); }
        }

        .wyf-tag::before {
          content: "";
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--ink);
          box-shadow: inset 0 0 0 2px var(--bone);
        }

        .wyf-tag-border {
          position: absolute;
          inset: 8px;
          border: 1.5px dashed var(--line);
          border-radius: 8px;
          pointer-events: none;
        }

        .wyf-eyebrow {
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.28em;
          color: var(--muted);
          margin: 14px 0 2px;
        }

        .wyf-word {
          font-family: 'Archivo Black', sans-serif;
          font-size: clamp(26px, 6.4vw, 34px);
          line-height: 0.95;
          letter-spacing: -0.01em;
          text-align: center;
          color: var(--ink);
          margin: 4px 0 18px;
        }

        .wyf-stamp-wrap {
          display: flex;
          justify-content: center;
          margin: 6px 0 18px;
        }
        .wyf-stamp {
          opacity: 0;
          transform: scale(2.6) rotate(-18deg);
          filter: blur(1px);
        }
        .wyf-stamp.in {
          animation: wyf-stamp-hit 0.42s cubic-bezier(.3,1.6,.4,1) forwards;
        }
        @keyframes wyf-stamp-hit {
          0%   { opacity: 0; transform: scale(2.6) rotate(-18deg); filter: blur(2px); }
          55%  { opacity: 1; transform: scale(0.9) rotate(-7deg); filter: blur(0); }
          75%  { transform: scale(1.08) rotate(-8deg); }
          100% { opacity: 1; transform: scale(1) rotate(-7deg); filter: blur(0); }
        }

        .wyf-divider {
          border: none;
          border-top: 1.5px dashed var(--line);
          margin: 0 0 14px;
        }

        .wyf-row {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .wyf-row b { color: var(--ink); font-weight: 700; }

        .wyf-barcode {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 34px;
          margin: 16px 0 6px;
          justify-content: center;
        }
        .wyf-barcode span {
          display: block;
          width: 3px;
          background: var(--ink);
          transform-origin: bottom;
          transform: scaleY(0);
          opacity: 0;
        }
        .wyf-barcode.in span {
          animation: wyf-bar-grow 0.32s ease-out forwards;
        }
        @keyframes wyf-bar-grow {
          to { transform: scaleY(1); opacity: 1; }
        }
        .wyf-barcode-num {
          text-align: center;
          font-size: 9.5px;
          letter-spacing: 0.2em;
          color: var(--muted);
          margin-bottom: 18px;
        }

        .wyf-status {
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: var(--ink);
          min-height: 16px;
          margin-bottom: 12px;
        }
        .wyf-status .dot {
          display: inline-block;
          width: 4px; height: 4px;
          background: var(--ink);
          border-radius: 50%;
          margin-left: 2px;
          animation: wyf-blink 1s steps(1) infinite;
        }
        .wyf-status .dot:nth-child(2) { animation-delay: 0.15s; }
        .wyf-status .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes wyf-blink { 0%, 40% { opacity: 1; } 41%, 100% { opacity: 0; } }

        .wyf-stitchbar {
          position: relative;
          height: 10px;
          margin: 0 2px 4px;
        }
        .wyf-stitchbar .track {
          position: absolute;
          inset: 0;
          top: 4px;
          height: 2px;
          background: var(--line);
        }
        .wyf-stitchbar .fill {
          position: absolute;
          top: 4px;
          left: 0;
          height: 2px;
          background: repeating-linear-gradient(
            to right, var(--ink) 0 5px, transparent 5px 9px
          );
          transition: width 1s linear;
        }
        .wyf-stitchbar .needle {
          position: absolute;
          top: -1px;
          width: 10px;
          height: 10px;
          transform: translateX(-50%);
          transition: left 1s linear;
        }
        .wyf-stitchbar .needle svg { width: 100%; height: 100%; }

        .wyf-footer {
          text-align: center;
          font-size: 9px;
          letter-spacing: 0.24em;
          color: var(--muted);
          margin-top: 14px;
        }

        @media (prefers-reduced-motion: reduce) {
          .wyf-tag, .wyf-stamp, .wyf-barcode span, .wyf-string, .wyf-loop {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="wyf-bg-word" aria-hidden="true">WYF</div>

      <div>
        <div className="wyf-loop" />
        <div className="wyf-string" />
        <div className="wyf-tag" role="status" aria-live="polite">
          <div className="wyf-tag-border" />

          <p className="wyf-eyebrow">ORDER RECEIPT</p>
          <h1 className="wyf-word">WHERE YOU<br />FROM?</h1>

          <div className="wyf-stamp-wrap">
            <StampSVG active={stage >= 1} />
          </div>

          <hr className="wyf-divider" />

          <div className="wyf-row"><span>STATUS</span><b>PLACED &amp; CONFIRMED</b></div>


          <div className={`wyf-barcode ${stage >= 2 ? "in" : ""}`} aria-hidden="true">
            {BARCODE_WIDTHS.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px`, animationDelay: `${i * 0.018}s` }}
              />
            ))}
          </div>


          <div className="wyf-status">
            {stage < 3 ? (
              <>PREPARING YOUR TAG<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></>
            ) : count > 0 ? (
              <>REDIRECTING TO DASHBOARD IN {count}s</>
            ) : (
              <>TAKING YOU THERE…</>
            )}
          </div>

          <div className="wyf-stitchbar" aria-hidden="true">
            <div className="track" />
            <div className="fill" style={{ width: `${progressPct}%` }} />
            <div className="needle" style={{ left: `${progressPct}%` }}>
              <NeedleSVG />
            </div>
          </div>

          <p className="wyf-footer">HANDLE WITH CARE · MADE FOR THE STREET</p>
        </div>
      </div>
    </div>
  );
}

const BARCODE_WIDTHS = [
  18, 26, 12, 30, 20, 14, 28, 16, 22, 12, 30, 18, 24, 14, 20, 28, 12, 26, 18, 22,
  16, 30, 14, 24, 20, 12, 28, 18, 26, 16,
];

function StampSVG({ active }) {
  return (
    <svg
      className={`wyf-stamp ${active ? "in" : ""}`}
      width="132"
      height="132"
      viewBox="0 0 132 132"
    >
      <defs>
        <filter id="wyf-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" />
        </filter>
      </defs>
      <g filter="url(#wyf-rough)">
        <circle cx="66" cy="66" r="58" fill="none" stroke="#0a0a0a" strokeWidth="3" />
        <circle cx="66" cy="66" r="49" fill="none" stroke="#0a0a0a" strokeWidth="1.4" />
        <text
          x="66" y="52" textAnchor="middle"
          fontFamily="'Archivo Black', sans-serif" fontSize="15" fill="#0a0a0a"
          letterSpacing="1"
        >
          CONFIRMED
        </text>
        <text
          x="66" y="72" textAnchor="middle"
          fontFamily="'Space Mono', monospace" fontSize="7.5" fill="#0a0a0a"
          letterSpacing="2"
        >
          ORDER PLACED
        </text>
        <line x1="30" y1="82" x2="102" y2="82" stroke="#0a0a0a" strokeWidth="1.2" />
        <text
          x="66" y="96" textAnchor="middle"
          fontFamily="'Space Mono', monospace" fontSize="7" fill="#0a0a0a"
          letterSpacing="1.5"
        >
          WYF QUALITY CHECKED
        </text>
      </g>
    </svg>
  );
}

function NeedleSVG() {
  return (
    <svg viewBox="0 0 10 10">
      <path d="M5 0 L5 7" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="5" cy="8.5" r="1.4" fill="#0a0a0a" />
    </svg>
  );
}