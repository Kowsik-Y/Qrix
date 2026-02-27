import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const gameSession = await prisma.gameSession.findUnique({
    where: { code },
    include: {
      game: {
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!gameSession)
    return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const players = await prisma.playerSession.findMany({
    where: { sessionId: gameSession.id },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({
    game: {
      ...gameSession,
      questions: gameSession.game.questions,
    },
    players: players.map(
      (p: {
        userId: string;
        score: number;
        user: { id: string; name: string | null; image: string | null };
      }) => ({
        userId: p.userId,
        name: p.user.name,
        image: p.user.image,
        score: p.score,
      })
    ),
  });
}
