"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { getPusherClient, gameChannel, EVENTS } from "@/lib/pusher";
import { Hexagon, Triangle, Square, Circle, Target, Trophy, BarChart, PartyPopper, Frown, CheckCircle2, Loader2 } from "lucide-react";
import Loader, { WaitScreen } from "@/components/Loader";
import TimerCircle from "@/components/TimerCircle";
import LeaderboardList, { LeaderboardEntry } from "@/components/LeaderboardList";

type GamePhase = "waiting" | "question" | "submitted" | "result" | "leaderboard" | "ended";

interface QuestionData {
    id: string;
    text: string;
    image?: string;
    optionA: string;
    imageA?: string;
    optionB: string;
    imageB?: string;
    optionC: string;
    imageC?: string;
    optionD: string;
    imageD?: string;
    timeLimit: number;
}

interface AnswerResult {
    isCorrect: boolean;
    points: number;
    basePoints: number;
    speedBonus: number;
    streakBonus: number;
    timeTaken: number;
    timeLimit: number;
    correct: string;
    correctText: string;
}

interface AnswerStats {
    optionCounts: Record<string, number>;
    totalAnswered: number;
    correctOption: string;
}

const OPTIONS = ["A", "B", "C", "D"] as const;
const OPTION_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#22c55e"];
const OPTION_ICONS = [<Hexagon key="0" fill="currentColor" size={14} />, <Triangle key="1" fill="currentColor" size={14} />, <Square key="2" fill="currentColor" size={14} />, <Circle key="3" fill="currentColor" size={14} />];

const emptyResult = (text: string): AnswerResult => ({
    isCorrect: false, points: 0, basePoints: 0, speedBonus: 0, streakBonus: 0, timeTaken: 0, timeLimit: 0, correct: "", correctText: text,
});

export default function PlayGamePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;

    const [phase, setPhase] = useState<GamePhase>("waiting");
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [qIndex, setQIndex] = useState(0);
    const [qTotal, setQTotal] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [answerStats, setAnswerStats] = useState<AnswerStats | null>(null);
    const [totalScore, setTotalScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const startTimeRef = useRef<number>(0);
    const answerResultRef = useRef<AnswerResult | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.push(`/play`);
    }, [status, router]);

    useEffect(() => {
        const pusher = getPusherClient();
        const ch = pusher.subscribe(gameChannel(code));

        ch.bind(EVENTS.GAME_STARTED, () => setPhase("waiting"));
        ch.bind(EVENTS.NEW_QUESTION, (data: { question: QuestionData; index: number; total: number }) => {
            setQuestion(data.question);
            setQIndex(data.index);
            setQTotal(data.total);
            setSelected(null);
            setAnswerResult(null);
            setAnswerStats(null);
            setLeaderboard([]);
            answerResultRef.current = null;
            setTimer(data.question.timeLimit);
            startTimeRef.current = Date.now();
            setPhase("question");
        });
        ch.bind(EVENTS.LEADERBOARD_UPDATE, (data: { leaderboard: LeaderboardEntry[] }) => {
            setLeaderboard(data.leaderboard);
            setPhase((prev) => prev === "result" ? prev : "leaderboard");
        });
        ch.bind(EVENTS.GAME_ENDED, (data: { leaderboard: LeaderboardEntry[] }) => {
            setLeaderboard(data.leaderboard);
            setPhase("ended");
        });
        ch.bind(EVENTS.ANSWER_STATS, (data: AnswerStats) => {
            setAnswerStats(data);
        });
        return () => { ch.unbind_all(); pusher.unsubscribe(gameChannel(code)); };
    }, [code]);

    // Auto-fetch leaderboard when timer hits 0
    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch(`/api/leaderboard/${code}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            }
        } catch { /* ignore */ }
    }, [code]);

    // Countdown — auto-reveal when timer hits 0
    useEffect(() => {
        if ((phase !== "question" && phase !== "submitted") || timer <= 0) {
            if (timer <= 0 && (phase === "question" || phase === "submitted")) {
                const result = answerResultRef.current;
                if (result) {
                    setAnswerResult(result);
                    setPhase("result");
                } else if (phase === "question") {
                    setAnswerResult(emptyResult("Time ran out!"));
                    setPhase("result");
                } else {
                    setPhase("result");
                }
                // Auto-fetch leaderboard when timer ends
                fetchLeaderboard();
            }
            return;
        }
        const t = setInterval(() => setTimer((v) => Math.max(0, v - 1)), 1000);
        return () => clearInterval(t);
    }, [phase, timer, fetchLeaderboard]);

    const handleAnswer = useCallback(async (opt: string) => {
        if (selected || !question) return;
        setSelected(opt);
        setPhase("submitted");
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await fetch("/api/answer/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: question.id, selected: opt, timeTaken, sessionCode: code }),
            });
            const data = await res.json();
            if (res.ok) {
                const result: AnswerResult = {
                    isCorrect: data.isCorrect, points: data.points,
                    basePoints: data.basePoints ?? 0, speedBonus: data.speedBonus ?? 0,
                    streakBonus: data.streakBonus ?? 0, timeTaken: data.timeTaken ?? 0,
                    timeLimit: data.timeLimit ?? 0,
                    correct: data.correct, correctText: data.correctText,
                };
                answerResultRef.current = result;
                setTotalScore((s) => s + (data.points ?? 0));
                setTimer((t) => { if (t <= 0) { setAnswerResult(result); setPhase("result"); fetchLeaderboard(); } return t; });
            } else {
                answerResultRef.current = emptyResult(data.error || "Error");
            }
        } catch {
            answerResultRef.current = emptyResult("Network error");
        }
    }, [selected, question, code, fetchLeaderboard]);

    if (status === "loading") return <Loader />;
    if (phase === "waiting") return <WaitScreen icon={<Target size={64} color="#a78bfa" />} label={`Waiting for host to start the game…\nGame code: ${code}`} />;

    if (phase === "ended") {
        const myRank = leaderboard.find((e) => e.userId === session?.user?.id);
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div className="glass-card animate-bounce-in" style={{ maxWidth: 460, width: "100%", padding: "2.5rem 2rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}><Trophy size={64} color="#fbbf24" /></div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>Game Over!</h1>
                    {myRank && <p style={{ color: "#a78bfa", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.5rem" }}>You finished #{myRank.rank} with {totalScore} points!</p>}
                    <LeaderboardList entries={leaderboard} myId={session?.user?.id} />
                    <button className="btn-ghost" style={{ width: "100%", marginTop: "1.5rem" }} onClick={() => router.push("/play")}>Play Again</button>
                </div>
            </div>
        );
    }

    if (phase === "leaderboard")
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div className="glass-card animate-bounce-in" style={{ maxWidth: 460, width: "100%", padding: "2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        <BarChart size={28} /> Leaderboard
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>After question {qIndex + 1} of {qTotal}</p>
                    <LeaderboardList entries={leaderboard} myId={session?.user?.id} />
                    <p style={{ marginTop: "1.25rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Waiting for next question…</p>
                </div>
            </div>
        );

    if (phase === "submitted" && question)
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div className="glass-card animate-bounce-in" style={{ maxWidth: 420, width: "100%", padding: "2.5rem 2rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                        <TimerCircle timer={timer} total={question.timeLimit} size={80} strokeWidth={5} warnAt={3} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <CheckCircle2 size={22} color="#4ade80" />
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4ade80" }}>Answer Locked In!</h2>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                        You picked <strong style={{ color: "#a78bfa" }}>Option {selected}</strong>
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        Waiting for timer to end…
                    </div>
                </div>
            </div>
        );

    if (phase === "result" && question) {
        const opts = [question.optionA, question.optionB, question.optionC, question.optionD];
        const maxCount = answerStats ? Math.max(...Object.values(answerStats.optionCounts), 1) : 1;

        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div className="glass-card animate-bounce-in" style={{ maxWidth: 500, width: "100%", padding: "2rem", textAlign: "center", maxHeight: "90vh", overflowY: "auto" }}>
                    {/* Correct / Wrong header */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                        {answerResult?.isCorrect ? <PartyPopper size={48} color="#4ade80" /> : <Frown size={48} color="#ef4444" />}
                    </div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 900, marginBottom: "0.4rem" }}>
                        {selected ? (answerResult?.isCorrect ? "Correct!" : "Wrong!") : "Time's Up!"}
                    </h2>
                    {answerResult?.correct && <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem", fontSize: "0.85rem" }}>Correct answer: <strong style={{ color: "#a78bfa" }}>{answerResult.correctText || `Option ${answerResult.correct}`}</strong></p>}
                    {!answerResult?.correct && answerResult?.correctText && <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem", fontSize: "0.85rem" }}>{answerResult.correctText}</p>}

                   

                   

                    {/* Answer distribution */}
                    {answerStats && (
                        <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
                            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                                Answer Distribution · {answerStats.totalAnswered} answered
                            </p>

                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "1rem", height: 140 }}>
                                {OPTIONS.map((opt, i) => {
                                    const count = answerStats.optionCounts[opt] || 0;
                                    const isCorrectOpt = answerStats.correctOption === opt;
                                    const isSelected = selected === opt;
                                    const heightPct = count > 0 ? (count / maxCount) * 100 : 0;

                                    return (
                                        <div key={opt} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", width: 44 }}>
                                            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: count > 0 ? "white" : "rgba(255,255,255,0.3)" }}>
                                                {count}
                                            </span>

                                            <div style={{ height: 112, width: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                                                {/* The empty track growing upwards */}
                                                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderTopLeftRadius: "0.3rem", borderTopRightRadius: "0.3rem", position: "relative", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                                                    {/* The dynamic fill bar */}
                                                    <div style={{
                                                        width: "100%",
                                                        height: `${heightPct}%`,
                                                        background: OPTION_COLORS[i],
                                                        opacity: isCorrectOpt ? 1 : 0.6,
                                                        transition: "height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s",
                                                    }} />
                                                </div>

                                                {/* The static base with the icon */}
                                                <div style={{
                                                    width: "100%", height: 32,
                                                    background: OPTION_COLORS[i],
                                                    opacity: isCorrectOpt ? 1 : 0.6,
                                                    borderBottomLeftRadius: "0.3rem", borderBottomRightRadius: "0.3rem",
                                                    display: "flex", alignItems: "center", justifyContent: "center", color: "white"
                                                }}>
                                                    {OPTION_ICONS[i]}
                                                </div>

                                                {/* Correct indicator glow */}
                                                {isCorrectOpt && (
                                                    <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: "100%", height: 4, background: "#22c55e", boxShadow: "0 -2px 10px #22c55e", borderRadius: 2 }} />
                                                )}
                                            </div>

                                            {/* "you" indicator below the bar */}
                                            <div style={{ height: 16 }}>
                                                {isSelected && <span style={{ fontSize: "0.6rem", fontWeight: 800, color: isCorrectOpt ? "#4ade80" : "#fca5a5", textTransform: "uppercase" }}>you</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                        Total: <strong style={{ color: "#a78bfa" }}>{totalScore} pts</strong>
                    </div>
                     {!answerResult?.isCorrect && selected && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.75rem", padding: "0.6rem", marginBottom: "1rem" }}>
                            <span style={{ color: "#fca5a5", fontWeight: 700, fontSize: "0.85rem" }}>0 pts — streak reset</span>
                        </div>
                    )}
                     {/* Scoring breakdown */}
                    {answerResult?.isCorrect && answerResult.points > 0 && (
                        <div style={{ borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1rem" }}>
                            <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "0.75rem 0.75rem 0 0", padding: "0.65rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "#4ade80", fontWeight: 800, fontSize: "1.1rem" }}>+{answerResult.points} pts</span>
                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{answerResult.timeTaken}s / {answerResult.timeLimit}s</span>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 0.75rem 0.75rem", fontSize: "0.78rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.5)" }}>✅ Base</span><span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>+{answerResult.basePoints}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.5)" }}>⚡ Speed</span><span style={{ color: answerResult.speedBonus > 300 ? "#fbbf24" : "rgba(255,255,255,0.7)", fontWeight: 700 }}>+{answerResult.speedBonus}</span></div>
                                {answerResult.streakBonus > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.5)" }}>🔥 Streak</span><span style={{ color: "#f97316", fontWeight: 700 }}>+{answerResult.streakBonus}</span></div>}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        );
    }

    if (phase === "question" && question) {
        const opts = [question.optionA, question.optionB, question.optionC, question.optionD];
        const optImages = [question.imageA, question.imageB, question.imageC, question.imageD];
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "2rem 1rem" }}>
                <div style={{ width: "100%", maxWidth: 600, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>Question {qIndex + 1}/{qTotal}</span>
                    <TimerCircle timer={timer} total={question.timeLimit} />
                </div>
                <div className="glass-card animate-fadeInUp" style={{ width: "100%", maxWidth: 600, padding: "1.75rem", marginBottom: "1.5rem", textAlign: "center" }}>
                    <p style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.5 }}>{question.text}</p>
                    {question.image && <img src={question.image} alt="Question" style={{ maxWidth: "100%", maxHeight: 250, borderRadius: "0.75rem", marginTop: "1rem", objectFit: "contain" }} />}
                </div>
                <div style={{ width: "100%", maxWidth: 600, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    {opts.map((opt, i) => (
                        <button key={i} className={`option-btn option-${OPTIONS[i].toLowerCase()}`} disabled={!!selected} onClick={() => handleAnswer(OPTIONS[i])}
                            style={{ animationDelay: `${i * 0.06}s`, opacity: 0, animation: `fadeInUp 0.4s ease ${i * 0.07}s forwards`, flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <span style={{ background: "rgba(0,0,0,0.25)", borderRadius: "0.4rem", padding: "0.2rem 0.55rem", fontWeight: 800, fontSize: "0.8rem" }}>{OPTION_ICONS[i]}</span>
                            {optImages[i] && <img src={optImages[i]} alt={`Option ${OPTIONS[i]}`} style={{ maxWidth: "100%", maxHeight: 80, borderRadius: "0.5rem", marginTop: "0.4rem", objectFit: "contain" }} />}
                            {opt}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: "1.5rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Score: <strong style={{ color: "#a78bfa" }}>{totalScore} pts</strong></div>
            </div>
        );
    }

    return <WaitScreen icon={<Target size={64} color="#a78bfa" />} label="Get ready!" />;
}
