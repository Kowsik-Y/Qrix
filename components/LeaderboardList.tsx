interface LeaderboardEntry {
    rank: number;
    name: string | null;
    score: number;
    userId: string;
}

interface LeaderboardListProps {
    entries: LeaderboardEntry[];
    myId?: string;
}

export default function LeaderboardList({ entries, myId }: LeaderboardListProps) {
    return (
        <div style={{ textAlign: "left" }}>
            {entries.map((e, i) => (
                <div key={e.userId} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.7rem 0.85rem",
                    borderRadius: "0.75rem",
                    marginBottom: "0.45rem",
                    background: e.userId === myId
                        ? "rgba(99,102,241,0.2)"
                        : i === 0
                            ? "rgba(251,191,36,0.08)"
                            : "rgba(255,255,255,0.04)",
                    border: e.userId === myId
                        ? "1px solid rgba(99,102,241,0.4)"
                        : i === 0
                            ? "1px solid rgba(251,191,36,0.2)"
                            : "1px solid transparent",
                    transform: i === 0 ? "scale(1.02)" : "none",
                    transition: "all 0.3s ease",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                        <span style={{
                            fontWeight: 900,
                            fontSize: i === 0 ? "1.1rem" : "0.85rem",
                            color: e.rank === 1 ? "#f59e0b" : e.rank === 2 ? "#94a3b8" : e.rank === 3 ? "#b45309" : "rgba(255,255,255,0.4)",
                            width: 28,
                        }}>
                            {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                        </span>
                        <span style={{ fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? "1rem" : "0.9rem" }}>
                            {e.name}{e.userId === myId ? " (you)" : ""}
                        </span>
                    </div>
                    <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: i === 0 ? "1rem" : "0.9rem" }}>
                        {e.score} pts
                    </span>
                </div>
            ))}
        </div>
    );
}

export type { LeaderboardEntry };
