"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPusherClient, gameChannel, EVENTS } from "@/lib/pusher";
import { useSession } from "next-auth/react";
import { Trophy, Medal, BarChart } from "lucide-react";

interface LeaderboardEntry {
    rank: number;
    name: string | null;
    image?: string | null;
    score: number;
    userId: string;
}

export default function LeaderboardPage() {
    const params = useParams();
    const code = params.code as string;
    const { data: session } = useSession();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [gameEnded, setGameEnded] = useState(false);

    useEffect(() => {
        fetch(`/api/leaderboard/${code}`)
            .then((r) => r.json())
            .then((d) => { if (d.leaderboard) setLeaderboard(d.leaderboard); });

        const pusher = getPusherClient();
        const ch = pusher.subscribe(gameChannel(code));
        ch.bind(EVENTS.LEADERBOARD_UPDATE, (data: { leaderboard: LeaderboardEntry[] }) => setLeaderboard(data.leaderboard));
        ch.bind(EVENTS.GAME_ENDED, (data: { leaderboard: LeaderboardEntry[] }) => { setLeaderboard(data.leaderboard); setGameEnded(true); });

        return () => { ch.unbind_all(); pusher.unsubscribe(gameChannel(code)); };
    }, [code]);

    const medalColors = ["#f59e0b", "#94a3b8", "#b45309"];

    return (
        <div style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}><Trophy size={48} color="#fbbf24" /></div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 900 }}>Live Leaderboard</h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Game {code} {gameEnded ? "· Final results" : "· Updating live…"}</p>
                </div>

                <div className="glass-card" style={{ padding: "1.5rem" }}>
                    {leaderboard.length === 0 ? (
                        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "2rem" }}>Waiting for results…</p>
                    ) : (
                        leaderboard.map((entry, i) => (
                            <div
                                key={entry.userId}
                                className="animate-fadeInUp"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    padding: "0.85rem 0.75rem",
                                    borderRadius: "0.75rem",
                                    marginBottom: "0.5rem",
                                    background: entry.userId === session?.user?.id ? "rgba(99,102,241,0.2)" : i < 3 ? "rgba(255,255,255,0.04)" : "transparent",
                                    border: entry.userId === session?.user?.id ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            >
                                {/* Rank */}
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: i < 3 ? medalColors[i] + "33" : "rgba(255,255,255,0.06)", border: `2px solid ${i < 3 ? medalColors[i] : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", color: i < 3 ? medalColors[i] : "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                                    {i < 3 ? <Medal size={20} color={medalColors[i]} /> : `#${entry.rank}`}
                                </div>

                                {/* Name */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {entry.name}{entry.userId === session?.user?.id ? " (you)" : ""}
                                    </div>
                                </div>

                                {/* Score */}
                                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: i === 0 ? "#f59e0b" : "#a78bfa" }}>
                                    {entry.score.toLocaleString()} pts
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {gameEnded && (
                    <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                        <a href={`/api/export/${code}`} download>
                            <button className="btn-success" style={{ padding: "0.85rem 2rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}><BarChart size={18} /> Export Results as Excel</span>
                            </button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
