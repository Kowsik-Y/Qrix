import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PlusCircle, Play, ChevronRight } from "lucide-react";

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Fetch games created by the user or shared with them
    const games = await prisma.game.findMany({
        where: {
            OR: [
                { hostId: session.user.id },
                { sharedWith: { some: { id: session.user.id } } }
            ]
        },
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { questions: true, gameSessions: true } }
        }
    });

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            Quiz<span className="text-indigo-400">GM</span>
                        </h1>
                        <p className="text-white/50 mt-1">Welcome back, {session.user.name}</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/play" className="btn-ghost flex items-center gap-2">
                            <Play size={18} /> Join Game
                        </Link>
                        <Link href="/host" className="btn-primary flex items-center gap-2">
                            <PlusCircle size={18} /> Create Quiz
                        </Link>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-6 text-white/90">Your Quizzes</h2>

                {games.length === 0 ? (
                    <div className="glass-card p-12 text-center text-white/50">
                        <div className="flex justify-center mb-4 opacity-50"><PlusCircle size={48} /></div>
                        <p className="text-lg">You haven&apos;t created any quizzes yet.</p>
                        <Link href="/host" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block font-medium">Create your first quiz &rarr;</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.map((game: any) => (
                            <Link key={game.id} href={`/host/${game.editCode}`} className="glass-card p-6 flex flex-col hover:border-indigo-500/30 transition-all hover:scale-[1.02] group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg leading-tight truncate pr-2">
                                        {game.title || `Quiz ${game.editCode}`}
                                    </h3>
                                    <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-indigo-300 border border-white/10 shrink-0">
                                        {game.editCode}
                                    </span>
                                </div>

                                <div className="text-sm text-white/40 mb-6 flex-grow">
                                    <p>{game._count.questions} questions &middot; {game._count.gameSessions} sessions</p>
                                    <p className="mt-1">Created {new Date(game.createdAt).toLocaleDateString()}</p>
                                </div>

                                <div className="flex justify-between items-center mt-auto text-white/30 group-hover:text-indigo-400 transition-colors">
                                    <span className="text-sm font-medium">Manage</span>
                                    <ChevronRight size={18} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
