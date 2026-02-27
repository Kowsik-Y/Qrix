"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizCardActions({ gameId }: { gameId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDuplicate = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch("/api/game/duplicate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to duplicate quiz.");
            }
        } catch (err) {
            console.error(err);
            alert("Error duplicating quiz.");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (loading) return;
        const email = prompt("Enter the email address of the user you want to share with:");
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch("/api/game/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, email })
            });
            if (res.ok) {
                alert(`Successfully shared with ${email}!`);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to share quiz.");
            }
        } catch (err) {
            console.error(err);
            alert("Error sharing quiz.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className="btn-ghost px-3 py-2 rounded-lg disabled:opacity-50"
                title="Duplicate Quiz"
                onClick={handleDuplicate}
                disabled={loading}
            >
                <Copy size={16} />
            </button>
            <button
                className="btn-ghost px-3 py-2 rounded-lg disabled:opacity-50"
                title="Share Quiz"
                onClick={handleShare}
                disabled={loading}
            >
                <Share2 size={16} />
            </button>
        </>
    );
}
