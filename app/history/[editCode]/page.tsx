"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { History, Users, Calendar, Trophy } from "lucide-react";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";

interface SessionEntry {
    id: string;
    code: string;
    status: string;
    createdAt: string;
    playerCount: number;
    topScorer: { name: string; score: number } | null;
}

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const editCode = params.editCode as string;

    const [title, setTitle] = useState("");
    const [history, setHistory] = useState<SessionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        if (!editCode) return;
        fetch(`/api/game/history?editCode=${editCode}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) { setError(data.error); }
                else {
                    setTitle(data.title || "Untitled Quiz");
                    setHistory(data.history || []);
                }
                setLoading(false);
            })
            .catch(() => { setError("Failed to load history."); setLoading(false); });
    }, [editCode]);

    if (status === "loading" || loading) return <Loader label="Loading history…" />;

    return (
        <div style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <PageHeader
                    title="Game History"
                    subtitle={`${title} · ${editCode}`}
                />

                {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

                {history.length === 0 ? (
                    <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><Calendar size={48} /></div>
                        <p style={{ color: "rgba(255,255,255,0.5)" }}>No game sessions yet.</p>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Launch this quiz from the dashboard to start a session.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {history.map((entry) => (
                            <div key={entry.id} className="glass-card" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                        <span className="font-mono text-sm" style={{ color: "#a78bfa", fontWeight: 700 }}>{entry.code}</span>
                                        <span style={{
                                            fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.4rem",
                                            background: entry.status === "ended" ? "rgba(34,197,94,0.15)" : entry.status === "active" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.08)",
                                            color: entry.status === "ended" ? "#4ade80" : entry.status === "active" ? "#60a5fa" : "rgba(255,255,255,0.5)",
                                            border: `1px solid ${entry.status === "ended" ? "rgba(34,197,94,0.3)" : entry.status === "active" ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.1)"}`,
                                            textTransform: "uppercase", letterSpacing: "0.05em",
                                        }}>{entry.status}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><Calendar size={13} /> {new Date(entry.createdAt).toLocaleDateString()}</span>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><Users size={13} /> {entry.playerCount} players</span>
                                        {entry.topScorer && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><Trophy size={13} color="#fbbf24" /> {entry.topScorer.name} ({entry.topScorer.score} pts)</span>}
                                    </div>
                                </div>
                                {entry.status === "ended" && (
                                    <a href={`/api/export/${entry.code}`} download className="btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}>Export</a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
