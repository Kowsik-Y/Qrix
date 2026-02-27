import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
    title: "QuizGM — Live Quiz Platform",
    description: "Real-time Kahoot-style quiz for 300 concurrent users",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-gradient-mesh">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
