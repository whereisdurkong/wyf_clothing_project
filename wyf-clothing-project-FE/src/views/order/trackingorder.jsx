import { useState } from "react";
import axios from "axios";
import { Truck, ExternalLink, Package, ArrowRight, X } from "lucide-react";
// ADJUST THIS IMPORT PATH to wherever your shared config lives
// (the same one used elsewhere for `${config.baseApi}/order`).
import config from "../../config";

// J&T Express Philippines tracker. Note: this is NOT the same carrier
// endpoint as the npm package's 'jtex' builder (which targets Thailand's
// jtexpress.co.th) — PH uses a different domain and param name.
const JTEX_PH_BASE = "https://www.jtexpress.ph/track-and-trace";
function buildJtexPhLink(orderId) {
    const params = new URLSearchParams({
        waybillNo: orderId.trim(),
        flag: "1",
    });
    return `${JTEX_PH_BASE}?${params.toString()}`;
}

function Barcode({ value }) {
    // Deterministic pseudo-barcode derived from the tracking number,
    // purely decorative — evokes a waybill without claiming to encode data.
    const bars = Array.from(value || "JT0000000000").map((ch) => ch.charCodeAt(0));
    return (
        <div className="barcode" aria-hidden="true">
            {bars.map((n, i) => (
                <span
                    key={i}
                    style={{
                        width: (n % 3) + 1,
                        height: 28 + (n % 5) * 4,
                    }}
                />
            ))}
        </div>
    );
}

export default function TrackingOrder() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [history, setHistory] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    async function performTrack(value) {
        if (!value) {
            setError("Enter a tracking number first.");
            return;
        }
        if (value.length < 6) {
            setError("That doesn't look like a full J&T tracking number.");
            return;
        }
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const res = await axios.get(
                `${config.baseApi}/order/get-tracking-status-by-number`,
                { params: { number: value } }
            );
            setResult(res.data);

            console.log('API response:', res.data);

            setHistory((prev) => [
                { number: value, ts: Date.now() },
                ...prev.filter((h) => h.number !== value),
            ].slice(0, 5));
        } catch (err) {
            if (err.response) {
                // Backend responded, but with an error status
                const base = err.response.data?.error || "Lookup failed.";
                const detail = err.response.data?.detail;
                const detailText =
                    typeof detail === "string"
                        ? detail
                        : detail
                            ? JSON.stringify(detail)
                            : null;
                setError(detailText ? `${base} — ${detailText}` : base);
            } else if (err.request) {
                // Request went out, no response came back
                setError("Couldn't reach the tracking server. Is your backend running?");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    function handleTrack(e) {
        e.preventDefault();
        performTrack(trackingNumber.trim());
    }

    function retrack(number) {
        setTrackingNumber(number);
        performTrack(number);
    }

    function removeHistory(number) {
        setHistory((prev) => prev.filter((h) => h.number !== number));
    }

    return (
        <div className="jt-page">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

        .jt-page {
          --ink: #211a14;
          --ink-soft: #6b5f52;
          --paper: #f4efe4;
          --paper-raised: #fffdf8;
          --line: #d8cfbd;
          --accent: #e5572c;
          --accent-dark: #b8401d;
          --stamp: #2f5233;
          font-family: 'Inter', sans-serif;
          min-height: 100%;
          background: var(--paper);
          background-image:
            radial-gradient(circle at 1px 1px, rgba(33,26,20,0.06) 1px, transparent 0);
          background-size: 22px 22px;
          color: var(--ink);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 20px;
          box-sizing: border-box;
        }

        .jt-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent-dark);
          margin: 0 0 8px;
        }

        .jt-title {
          font-family: 'Oswald', sans-serif;
          font-weight: 700;
          font-size: clamp(28px, 5vw, 40px);
          letter-spacing: 0.01em;
          text-transform: uppercase;
          margin: 0 0 6px;
          line-height: 1.05;
        }

        .jt-sub {
          color: var(--ink-soft);
          font-size: 14.5px;
          margin: 0 0 28px;
          max-width: 46ch;
        }

        .jt-wrap {
          width: 100%;
          max-width: 480px;
        }

        .waybill {
          position: relative;
          background: var(--paper-raised);
          border: 1.5px solid var(--ink);
          box-shadow: 6px 6px 0 var(--accent);
          padding: 28px 26px 24px;
        }

        .waybill::before {
          content: "";
          position: absolute;
          top: -1.5px;
          bottom: -1.5px;
          left: -10px;
          width: 18px;
          background-image: radial-gradient(circle, var(--paper) 3.5px, transparent 3.6px);
          background-size: 18px 18px;
          background-position: center;
        }

        .waybill-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1.5px dashed var(--line);
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .waybill-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .waybill-brand .icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .waybill-brand-text {
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .waybill-brand-text span {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 400;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          color: var(--ink-soft);
          text-transform: none;
          margin-top: 2px;
        }

        .stamp {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--stamp);
          border: 1.5px solid var(--stamp);
          border-radius: 3px;
          padding: 5px 8px;
          transform: rotate(-4deg);
          text-transform: uppercase;
          white-space: nowrap;
        }

        .field-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin: 0 0 8px;
        }

        .field-row {
          display: flex;
          gap: 8px;
        }

        .field-input {
          flex: 1;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 15px;
          letter-spacing: 0.03em;
          padding: 12px 14px;
          border: 1.5px solid var(--ink);
          background: #fff;
          color: var(--ink);
          outline: none;
        }

        .field-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(229, 87, 44, 0.15);
        }

        .field-input::placeholder {
          color: #b8ada0;
        }

        .track-btn {
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: var(--accent);
          color: #fff;
          border: 1.5px solid var(--ink);
          padding: 0 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
        }

        .track-btn:hover {
          background: var(--accent-dark);
        }

        .track-btn:active {
          transform: translateY(1px);
        }

        .track-btn:focus-visible {
          outline: 3px solid var(--stamp);
          outline-offset: 2px;
        }

        .error-msg {
          color: var(--accent-dark);
          font-size: 12.5px;
          margin: 8px 0 0;
          font-family: 'IBM Plex Mono', monospace;
        }

        .barcode {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1.5px dashed var(--line);
        }

        .barcode span {
          display: inline-block;
          background: var(--ink);
        }

        .destination-note {
          margin-top: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
          text-transform: uppercase;
        }

        .helper-note {
          margin-top: 14px;
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.5;
        }

        .status-panel {
          margin-top: 18px;
          background: var(--paper-raised);
          border: 1.5px solid var(--ink);
          padding: 18px 20px;
        }

        .status-head {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 3px;
          border: 1.5px solid var(--ink);
          background: #efe7d6;
        }

        .status-delivered {
          background: var(--stamp);
          color: #fff;
          border-color: var(--stamp);
        }

        .status-exception {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent-dark);
        }

        .status-sub {
          font-size: 12.5px;
          color: var(--ink-soft);
        }

        .status-eta {
          margin: 10px 0 0;
          font-size: 12.5px;
          color: var(--ink-soft);
        }

        .status-empty {
          margin: 12px 0 0;
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.5;
        }

        .timeline {
          list-style: none;
          margin: 16px 0 0;
          padding: 0;
        }

        .timeline-item {
          display: flex;
          gap: 12px;
          padding-bottom: 14px;
          position: relative;
        }

        .timeline-item:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 3px;
          top: 12px;
          bottom: -2px;
          width: 1.5px;
          background: var(--line);
        }

        .timeline-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          margin-top: 5px;
          flex-shrink: 0;
        }

        .timeline-msg {
          margin: 0;
          font-size: 13px;
          color: var(--ink);
        }

        .timeline-meta {
          margin: 2px 0 0;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .history {
          margin-top: 22px;
        }

        .history-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin: 0 0 10px;
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: var(--paper-raised);
          border: 1px solid var(--line);
          padding: 10px 12px;
          margin-bottom: 6px;
        }

        .history-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .history-link:hover {
          color: var(--accent-dark);
        }

        .history-item button {
          background: none;
          border: none;
          color: var(--ink-soft);
          cursor: pointer;
          padding: 4px;
          display: flex;
        }

        .history-item button:hover {
          color: var(--accent-dark);
        }
      `}</style>

            <div className="jt-wrap">
                <p className="jt-eyebrow">Parcel lookup</p>
                <h1 className="jt-title">Track your J&amp;T PH parcel</h1>
                <p className="jt-sub">
                    Enter your J&amp;T Express Philippines waybill number below. We'll
                    open the official jtexpress.ph tracker with your number filled
                    in — live status comes straight from J&amp;T, not from us.
                </p>

                <form className="waybill" onSubmit={handleTrack}>
                    <div className="waybill-head">
                        <div className="waybill-brand">
                            <div className="icon-badge">
                                <Truck size={18} />
                            </div>
                            <div className="waybill-brand-text">
                                J&amp;T Express
                                <span>Consignment tracking</span>
                            </div>
                        </div>
                        <div className="stamp">Philippines</div>
                    </div>

                    <p className="field-label">Tracking number</p>
                    <div className="field-row">
                        <input
                            className="field-input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="e.g. 630123456789"
                            value={trackingNumber}
                            onChange={(e) => {
                                setTrackingNumber(e.target.value);
                                if (error) setError("");
                            }}
                            aria-label="J&T tracking number"
                            aria-invalid={!!error}
                        />
                        <button
                            type="submit"
                            className="track-btn"
                            disabled={!trackingNumber.trim() || loading}
                        >
                            {loading ? "Tracking\u2026" : "Track"}
                            {!loading && <ArrowRight size={15} />}
                        </button>
                    </div>
                    {error && <p className="error-msg">{error}</p>}

                    <Barcode value={trackingNumber || "JT0000000000"} />
                    <p className="destination-note">
                        <Package size={11} style={{ verticalAlign: "-1.5px", marginRight: 4 }} />
                        Status pulled live via AfterShip
                    </p>
                </form>

                {result && (
                    <div className="status-panel">
                        <div className="status-head">
                            <span className={`status-pill status-${(result.status || "unknown").toLowerCase()}`}>
                                {result.status || "Unknown"}
                            </span>
                            {result.subStatus && (
                                <span className="status-sub">{result.subStatus}</span>
                            )}
                        </div>
                        {result.estimatedDelivery && (
                            <p className="status-eta">
                                Estimated delivery: {result.estimatedDelivery}
                            </p>
                        )}
                        {result.checkpoints && result.checkpoints.length > 0 ? (
                            <ol className="timeline">
                                {[...result.checkpoints]
                                    .sort((a, b) => new Date(b.time) - new Date(a.time))
                                    .map((cp, i) => (
                                        <li key={i} className="timeline-item">
                                            <span className="timeline-dot" />
                                            <div>
                                                <p className="timeline-msg">{cp.message}</p>
                                                <p className="timeline-meta">
                                                    {cp.location ? `${cp.location} \u00b7 ` : ""}
                                                    {cp.time
                                                        ? new Date(cp.time).toLocaleString("en-PH", {
                                                            dateStyle: "medium",
                                                            timeStyle: "short",
                                                        })
                                                        : ""}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                            </ol>
                        ) : (
                            <p className="status-empty">
                                No checkpoints yet — J&amp;T hasn't scanned this parcel, or
                                AfterShip just registered it and is still fetching. Try
                                again in a few minutes.
                            </p>
                        )}
                    </div>
                )}

                {history.length > 0 && (
                    <div className="history">
                        <p className="history-title">Recently tracked</p>
                        {history.map((h) => (
                            <div className="history-item" key={h.number}>
                                <button
                                    type="button"
                                    className="history-link"
                                    onClick={() => retrack(h.number)}
                                >
                                    <ExternalLink size={13} />
                                    {h.number}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeHistory(h.number)}
                                    aria-label={`Remove ${h.number} from recent list`}
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <p className="helper-note">
                    Status and checkpoints come from AfterShip, which polls J&amp;T
                    Express Philippines on your behalf. A newly-added tracking
                    number can take a few minutes to show its first checkpoint.
                </p>
            </div>
        </div>
    );
}