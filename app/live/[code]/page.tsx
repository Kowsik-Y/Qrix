"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { getPusherClient, gameChannel, EVENTS } from "@/lib/pusher";
import { Users, CheckCircle, FileText, Timer, Gamepad2, Hourglass, Trophy, Rocket, BarChart, Flag } from "lucide-react";

interface Player {
    userId: string;
    name: string;
    image?: string;
}

interface LeaderboardEntry {
    rank: number;
    name: string | null;
    image?: string | null;
    score: number;
    userId: string;
}

export default function HostGamePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;

    const [players, setPlayers] = useState<Player[]>([]);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [gameEnded, setGameEnded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<{ text: string; timeLimit: number } | null>(null);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    // Fetch player count from game
    useEffect(() => {
        if (!code) return;
        fetch(`/api/game/${code}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.game) {
                    setTotalQuestions(data.game.questions?.length ?? 0);
                    setPlayers(data.players ?? []);
                }
            })
            .catch(() => { });
    }, [code]);

    useEffect(() => {
        const pusher = getPusherClient();
        const ch = pusher.subscribe(gameChannel(code));

        ch.bind(EVENTS.PLAYER_JOINED, (data: Player) => {
            setPlayers((p) => [...p.filter((x) => x.userId !== data.userId), data]);
        });

        ch.bind(EVENTS.NEW_QUESTION, (data: { question: { text: string; timeLimit: number }; index: number; total: number }) => {
            setCurrentIndex(data.index);
            setTotalQuestions(data.total);
            setCurrentQuestion(data.question);
            setAnsweredCount(0);
            setTimer(data.question.timeLimit);
        });

        ch.bind(EVENTS.PLAYER_ANSWERED, () => {
            setAnsweredCount((c) => c + 1);
        });

        ch.bind(EVENTS.LEADERBOARD_UPDATE, (data: { leaderboard: LeaderboardEntry[] }) => {
            setLeaderboard(data.leaderboard);
        });

        ch.bind(EVENTS.GAME_ENDED, (data: { leaderboard: LeaderboardEntry[] }) => {
            setLeaderboard(data.leaderboard);
            setGameEnded(true);
        });

        return () => { ch.unbind_all(); pusher.unsubscribe(gameChannel(code)); };
    }, [code]);

    // Countdown timer
    useEffect(() => {
        if (!currentQuestion || timer <= 0) return;
        const t = setInterval(() => setTimer((v) => Math.max(0, v - 1)), 1000);
        return () => clearInterval(t);
    }, [currentQuestion, timer]);

    const startGame = async () => {
        setLoading(true);
        await fetch("/api/game/next-question", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
        setGameStarted(true);
        setLoading(false);
    };

    const nextQuestion = async () => {
        setLoading(true);
        const res = await fetch("/api/game/next-question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
        const data = await res.json();
        if (data.ended) setGameEnded(true);
        setLoading(false);
    };

    const showLeaderboard = async () => {
        await fetch(`/api/leaderboard/${code}`);
    };

    if (status === "loading")
        return <LoadingScreen />;

    if (gameEnded)
        return <EndScreen code={code} leaderboard={leaderboard} />;

    return (
        <div style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}><Gamepad2 size={24} /> Host Panel</h1>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>Game code: <strong style={{ color: "#a78bfa", fontSize: "1rem", letterSpacing: "0.1em" }}>{code}</strong></p>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <StatCard label="Players joined" value={players.length} icon={<Users size={24} />} />
                    <StatCard label="Answers received" value={answeredCount} icon={<CheckCircle size={24} />} />
                    {gameStarted && <StatCard label="Question" value={`${currentIndex + 1} / ${totalQuestions}`} icon={<FileText size={24} />} />}
                    {currentQuestion && <StatCard label="Time left" value={`${timer}s`} icon={<Timer size={24} />} />}
                </div>

                {/* Player list */}
                {!gameStarted && players.length > 0 && (
                    <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem" }}>PLAYERS IN LOBBY</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {players.map((p) => (
                                <span key={p.userId} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.85rem" }}>
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current question preview */}
                {currentQuestion && (
                    <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.5rem" }}>CURRENT QUESTION</p>
                        <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{currentQuestion.text}</p>
                    </div>
                )}

                {/* Mini leaderboard */}
                {leaderboard.length > 0 && (
                    <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.75rem" }}>LEADERBOARD PREVIEW</p>
                        {leaderboard.slice(0, 5).map((p) => (
                            <div key={p.userId} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <span>#{p.rank} {p.name}</span>
                                <span style={{ color: "#a78bfa", fontWeight: 700 }}>{p.score} pts</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {!gameStarted ? (
                        <button className="btn-primary" style={{ flex: 1 }} onClick={startGame} disabled={loading || players.length === 0}>
                            {loading ? "Starting…" : <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}><Rocket size={18} /> Start Game ({players.length} players)</span>}
                        </button>
                    ) : (
                        <>
                            <button className="btn-ghost" onClick={showLeaderboard} style={{ flex: 1 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}><BarChart size={18} /> Show Leaderboard</span>
                            </button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={nextQuestion} disabled={loading}>
                                {loading ? "Loading…" : currentIndex + 1 >= totalQuestions ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}>End Game <Flag size={18} /></span> : "Next Question →"}
                            </button>
                        </>
                    )}
                </div>

                {/* Share link */}
                <div style={{ marginTop: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                    Players join at <strong style={{ color: "rgba(255,255,255,0.7)" }}>{typeof window !== "undefined" ? window.location.origin : ""}/play</strong> with code <strong style={{ color: "#a78bfa" }}>{code}</strong>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="glass-card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
            <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>{label}</div>
            </div>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div className="animate-pulse-glow" style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}><Hourglass size={48} /></div>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading game…</p>
            </div>
        </div>
    );
}

function EndScreen({ code, leaderboard }: { code: string; leaderboard: LeaderboardEntry[] }) {
    return (
        <div style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}><Trophy size={64} color="#fbbf24" /></div>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>Game Over!</h1>
                <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>Final results for game {code}</p>

                <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                    {leaderboard.map((p) => (
                        <div key={p.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: 28, fontWeight: 800, color: p.rank === 1 ? "#f59e0b" : p.rank === 2 ? "#94a3b8" : p.rank === 3 ? "#b45309" : "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>#{p.rank}</span>
                                <span style={{ fontWeight: 600 }}>{p.name}</span>
                            </div>
                            <span style={{ color: "#a78bfa", fontWeight: 800 }}>{p.score} pts</span>
                        </div>
                    ))}
                </div>

                <a href={`/api/export/${code}`} download>
                    <button className="btn-success" style={{ width: "100%", fontSize: "1rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}><BarChart size={18} /> Export Results as Excel</span>
                    </button>
                </a>
            </div>
        </div>
    );
}
