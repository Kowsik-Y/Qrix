import { Target } from "lucide-react";

interface LoaderProps {
    label?: string;
}

export default function Loader({ label = "Loading…" }: LoaderProps) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <div style={{ textAlign: "center" }} className="w-fit flex flex-col items-center justify-center">
                <Target size={48} color="#a78bfa" className="animate-pulse-glow rounded-full"
                    style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }} />
            </div>
        </div>
    );
}

interface WaitScreenProps {
    icon: React.ReactNode;
    label: string;
}

export function WaitScreen({ icon, label }: WaitScreenProps) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <div style={{ textAlign: "center" }} className="w-fit flex flex-col items-center justify-center">
                <div
                    className="animate-pulse-glow p-4"
                    style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}

                >
                    {icon}
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", whiteSpace: "pre-line" }}>
                    {label}
                </p>
            </div>
        </div>
    );
}
