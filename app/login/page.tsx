"use client";
import { signIn } from "next-auth/react";
import { Target, Zap, Trophy, BarChart } from "lucide-react";

export default function LoginPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
        >
            <div className="glass-card animate-fadeInUp" style={{ maxWidth: 420, width: "100%", padding: "2.5rem 2rem", textAlign: "center" }}>
                {/* Logo */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "1.25rem",
                            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 1rem",
                            boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
                        }}
                        className="animate-pulse-glow"
                    >
                        <Target size={36} color="white" />
                    </div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>
                        Quiz<span style={{ color: "#a78bfa" }}>GM</span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem" }}>
                        Real-time quiz platform for up to 300 players
                    </p>
                </div>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
                    {[
                        { icon: <Zap size={18} />, text: "Real-time WebSocket gameplay" },
                        { icon: <Trophy size={18} />, text: "Live leaderboard & scoring" },
                        { icon: <BarChart size={18} />, text: "Excel export after game" }
                    ].map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.6rem", padding: "0.6rem 1rem", color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {f.icon}
                            <span>{f.text}</span>
                        </div>
                    ))}
                </div>

                {/* Sign in */}
                <button
                    className="btn-primary"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", fontSize: "1rem" }}
                    onClick={() => signIn("google", { callbackUrl: "/host" })}
                >
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.1 7.4-10.2 7.4-17.3z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9l-8 6.2C6.6 42.7 14.7 48 24 48z" /><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l8-6.2z" /><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.1 30.5 0 24 0 14.7 0 6.6 5.3 2.6 13.2l8 6.2C12.5 13.7 17.8 9.5 24 9.5z" /></svg>
                    Continue with Google
                </button>

                <p style={{ marginTop: "1.25rem", color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>
                    Secure sign-in via Google OAuth · Sessions stored in Supabase
                </p>
            </div>
        </div>
    );
}
