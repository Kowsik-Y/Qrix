"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backHref = "/", children }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <button
                className="btn-ghost"
                onClick={() => router.push(backHref)}
                style={{ padding: "0.5rem 0.75rem" }}
            >
                <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.2 }}>{title}</h1>
                {subtitle && (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}
