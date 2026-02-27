"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Gamepad2, Rocket, Target } from "lucide-react";

export default function PlayPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleJoin = async () => {
        if (!code || code.length !== 6) { setError("Enter a 6-digit game code."); return; }
        if (!session) { signIn("google", { callbackUrl: `/play?code=${code}` }); return; }
        setLoading(true);
        setError("");
        const res = await fetch("/api/game/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to join"); setLoading(false); return; }
        router.push(`/play/${code}`);
    };

    // Auto-fill from URL param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const c = params.get("code");
        if (c) setCode(c);
    }, []);

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <div className="glass-card animate-fadeInUp" style={{ maxWidth: 420, width: "100%", padding: "2.5rem 2rem", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}><Gamepad2 size={48} /></div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "0.4rem" }}>
                    Join a <span style={{ color: "#a78bfa" }}>Quiz</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                    {session ? `Playing as ${session.user?.name}` : "Sign in with Google to play"}
                </p>

                <input
                    className="quiz-input"
                    placeholder="Enter 6-digit game code"
                    value={code}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.15em", marginBottom: "1rem" }}
                />

                {error && (
                    <div style={{ marginBottom: "1rem", padding: "0.65rem 1rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.6rem", color: "#fca5a5", fontSize: "0.88rem" }}>
                        {error}
                    </div>
                )}

                <button className="btn-primary" style={{ width: "100%", fontSize: "1rem", padding: "1rem" }} onClick={handleJoin} disabled={loading}>
                    {loading ? "Joining…" : session ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}>Join Game <Rocket size={18} /></span> : <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}>Sign in to Play <Target size={18} /></span>}
                </button>

                {!session && status !== "loading" && (
                    <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                        You&apos;ll be redirected back after signing in
                    </p>
                )}
            </div>
        </div>
    );
}
