import { useState, useEffect } from "react";

const phrase = "Where you from?";

const letters = phrase.split("").map((char, i) => ({ char, i }));

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@1&display=swap');

  @keyframes letterWave {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    25%      { transform: translateY(-16px) rotate(-5deg); }
    75%      { transform: translateY(7px) rotate(4deg); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes blink {
    0%,100% { opacity: 0.2; }
    50%     { opacity: 1; }
  }

  .wyf-letter {
    display: inline-block;
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: clamp(40px, 8vw, 64px);
    color: #111;
    animation: letterWave 1.8s ease-in-out infinite;
    transform-origin: center bottom;
    will-change: transform;
  }

  .wyf-sub {
    animation: fadeUp 0.6s ease-out both;
  }

  .wyf-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    animation: blink 1.6s ease-in-out infinite;
  }
`;

export default function Loading() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <style>{style}</style>
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "24px",
                    backgroundColor: "rgba(250, 249, 247, 0.15)",
                    backdropFilter: "blur(1px)",
                    zIndex: 9999,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        lineHeight: 1,
                        userSelect: "none",
                    }}
                    aria-label={phrase}
                >
                    {letters.map(({ char, i }) =>
                        char === " " ? (
                            <span key={i} style={{ width: "clamp(10px,2vw,20px)" }} />
                        ) : (
                            <span
                                key={i}
                                className="wyf-letter"
                                style={{ animationDelay: `${i * 0.08}s` }}
                                aria-hidden="true"
                            >
                                {char}
                            </span>
                        )
                    )}
                </div>

                <div
                    style={{
                        width: 40,
                        height: "0.5px",
                        background: "#bbb",
                        opacity: 0.6,
                    }}
                />

                <p
                    className="wyf-sub"
                    style={{
                        fontSize: 11,
                        letterSpacing: "4px",
                        textTransform: "uppercase",
                        color: "#aaa",
                        fontFamily: "sans-serif",
                        margin: 0,
                        animationDelay: "0.4s",
                    }}
                >
                    loading
                </p>

                <div
                    style={{ display: "flex", gap: 8, animationDelay: "0.7s" }}
                    className="wyf-sub"
                    aria-hidden="true"
                >
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="wyf-dot"
                            style={{ animationDelay: `${i * 0.3}s` }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}