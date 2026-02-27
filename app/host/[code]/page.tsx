"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
    Rocket, Pencil, Trash2, History, Copy, Share2,
    Users, FileText, Calendar, Trophy,
    Clock, Plus
} from "lucide-react";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";

interface QuestionPreview {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct: string;
    timeLimit: number;
    order: number;
}

interface SessionEntry {
    id: string;
    code: string;
    status: string;
    createdAt: string;
    playerCount: number;
    topScorer: { name: string; score: number } | null;
}

export default function QuizManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const editCode = params.code as string;

    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState<QuestionPreview[]>([]);
    const [sessions, setSessions] = useState<SessionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [launching, setLaunching] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [duplicating, setDuplicating] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [gameId, setGameId] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        if (!editCode || status !== "authenticated") return;

        Promise.all([
            fetch(`/api/game/get?editCode=${editCode}`).then((r) => r.json()),
            fetch(`/api/game/history?editCode=${editCode}`).then((r) => r.json()),
        ])
            .then(([quizData, historyData]) => {
                if (quizData.error) {
                    setError(quizData.error);
                } else {
                    setTitle(quizData.title || "Untitled Quiz");
                    setQuestions(quizData.questions || []);
                    setGameId(quizData.id);
                }
                if (!historyData.error) {
                    setSessions(historyData.history || []);
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load quiz.");
                setLoading(false);
            });
    }, [editCode, status]);

    const handleLaunch = async () => {
        setLaunching(true);
        try {
            const res = await fetch("/api/game/launch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ editCode }),
            });
            if (!res.ok) throw new Error("Failed to launch");
            const data = await res.json();
            router.push(`/live/${data.code}`);
        } catch {
            alert("Failed to launch quiz session.");
            setLaunching(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this quiz? This will also delete all game history.")) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/game/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ editCode }),
            });
            if (!res.ok) throw new Error("Failed");
            router.push("/");
        } catch {
            alert("Failed to delete quiz.");
            setDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        setDuplicating(true);
        try {
            const res = await fetch("/api/game/duplicate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId }),
            });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            router.push(`/host/${data.editCode}`);
        } catch {
            alert("Failed to duplicate quiz.");
            setDuplicating(false);
        }
    };

    const handleShare = async () => {
        const email = prompt("Enter the email of the user you want to share with:");
        if (!email) return;
        setSharing(true);
        try {
            const res = await fetch("/api/game/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, email }),
            });
            if (res.ok) {
                alert(`Shared with ${email}!`);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to share.");
            }
        } catch {
            alert("Error sharing quiz.");
        } finally {
            setSharing(false);
        }
    };

    if (status === "loading" || loading) return <Loader label="Loading quiz…" />;

    if (error)
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div className="glass-card" style={{ padding: "2rem", maxWidth: 420, textAlign: "center" }}>
                    <p style={{ color: "#fca5a5", marginBottom: "1rem" }}>{error}</p>
                    <button className="btn-ghost" onClick={() => router.push("/")}>Back to Dashboard</button>
                </div>
            </div>
        );

    return (
        <div style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <PageHeader title={title} subtitle={`Quiz ID: ${editCode}`} />

                {/* Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
                    <button
                        className="btn-primary"
                        style={{ padding: "1rem", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                        onClick={handleLaunch}
                        disabled={launching || questions.length === 0}
                    >
                        {launching ? "Launching…" : <><Rocket size={20} /> Launch Game</>}
                    </button>
                    <button
                        className="btn-ghost"
                        style={{ padding: "1rem", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                        onClick={() => router.push(`/host/edit/${editCode}`)}
                    >
                        <Pencil size={18} /> Edit Quiz
                    </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                    <button
                        className="btn-ghost"
                        style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                        onClick={handleDuplicate}
                        disabled={duplicating}
                    >
                        <Copy size={15} /> {duplicating ? "Duplicating…" : "Duplicate"}
                    </button>
                    <button
                        className="btn-ghost"
                        style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                        onClick={handleShare}
                        disabled={sharing}
                    >
                        <Share2 size={15} /> Share
                    </button>
                    <button
                        className="btn-ghost"
                        style={{
                            padding: "0.6rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem",
                            color: "#fca5a5", borderColor: "rgba(239,68,68,0.2)"
                        }}
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete"}
                    </button>
                </div>

                {/* Questions Preview */}
                <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                            <FileText size={16} style={{ display: "inline", marginRight: "0.4rem", verticalAlign: "middle" }} />
                            Questions ({questions.length})
                        </h2>
                        <button
                            className="btn-ghost"
                            style={{ padding: "0.35rem 0.7rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                            onClick={() => router.push(`/host/edit/${editCode}`)}
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                    {questions.length === 0 ? (
                        <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
                            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>No questions yet.</p>
                            <button className="btn-primary" style={{ fontSize: "0.9rem", padding: "0.6rem 1.5rem" }} onClick={() => router.push(`/host/edit/${editCode}`)}>
                                Add Questions
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {questions.sort((a, b) => a.order - b.order).map((q, i) => (
                                <div key={q.id} className="glass-card" style={{ padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{
                                        width: 28, height: 28, borderRadius: "0.5rem",
                                        background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.75rem", fontWeight: 800, color: "#a78bfa", flexShrink: 0
                                    }}>
                                        {i + 1}
                                    </span>
                                    <p style={{ flex: 1, fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.3 }} className="truncate">
                                        {q.text || "Empty question"}
                                    </p>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", flexShrink: 0 }}>
                                        <Clock size={12} /> {q.timeLimit}s
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Game History */}
                <div>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "0.75rem" }}>
                        <History size={16} style={{ display: "inline", marginRight: "0.4rem", verticalAlign: "middle" }} />
                        Game History ({sessions.length})
                    </h2>
                    {sessions.length === 0 ? (
                        <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
                            <p style={{ color: "rgba(255,255,255,0.4)" }}>No game sessions yet. Launch to start playing!</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {sessions.map((entry) => (
                                <div key={entry.id} className="glass-card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                                            <span className="font-mono" style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.9rem" }}>
                                                {entry.code}
                                            </span>
                                            <span style={{
                                                fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "0.3rem",
                                                background: entry.status === "ended" ? "rgba(34,197,94,0.15)" : entry.status === "active" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
                                                color: entry.status === "ended" ? "#4ade80" : entry.status === "active" ? "#60a5fa" : "rgba(255,255,255,0.4)",
                                                textTransform: "uppercase", letterSpacing: "0.05em",
                                            }}>
                                                {entry.status}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                                <Calendar size={11} /> {new Date(entry.createdAt).toLocaleDateString()}
                                            </span>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                                <Users size={11} /> {entry.playerCount}
                                            </span>
                                            {entry.topScorer && (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                                    <Trophy size={11} color="#fbbf24" /> {entry.topScorer.name} ({entry.topScorer.score}pts)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {entry.status === "ended" && (
                                        <a href={`/api/export/${entry.code}`} download className="btn-ghost" style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}>
                                            Export
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
