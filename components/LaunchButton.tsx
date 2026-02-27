"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";

export default function LaunchButton({ editCode }: { editCode: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLaunch = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/game/launch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ editCode }),
            });
            if (!res.ok) throw new Error("Failed to launch");
            const data = await res.json();
            router.push(`/live/${data.code}`);
        } catch (err) {
            console.error(err);
            alert("Failed to launch quiz session.");
            setLoading(false);
        }
    };

    return (
        <button
            className="btn-primary flex-1 text-center py-2 text-sm rounded-lg flex justify-center items-center gap-2"
            onClick={handleLaunch}
            disabled={loading}
        >
            {loading ? "Launching…" : <><Rocket size={16} /> Launch</>}
        </button>
    );
}
