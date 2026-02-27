interface TimerCircleProps {
    timer: number;
    total: number;
    size?: number;
    strokeWidth?: number;
    warnAt?: number;
}

export default function TimerCircle({
    timer,
    total,
    size = 56,
    strokeWidth = 4,
    warnAt = 5,
}: TimerCircleProps) {
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = total > 0 ? timer / total : 0;
    const isWarning = timer <= warnAt;

    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={isWarning ? "#ef4444" : "#6366f1"}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                />
            </svg>
            <span style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: size * 0.017 + "rem",
                color: isWarning ? "#ef4444" : "white",
            }}>
                {timer}
            </span>
        </div>
    );
}
