import { prisma } from "@/lib/db";
import { pusherServer, gameChannel, EVENTS } from "@/lib/pusher";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const gameSession = await prisma.gameSession.findUnique({
    where: { code },
  });
  if (!gameSession)
    return Response.json({ error: "Game not found" }, { status: 404 });

  const players = await prisma.playerSession.findMany({
    where: { sessionId: gameSession.id },
    include: { user: true },
    orderBy: { score: "desc" },
  });

  const leaderboard = players.map(
    (
      p: {
        userId: string;
        score: number;
        user: { name: string | null; image: string | null };
      },
      i: number
    ) => ({
      rank: i + 1,
      name: p.user.name,
      image: p.user.image,
      score: p.score,
      userId: p.userId,
    })
  );

  await pusherServer.trigger(gameChannel(code), EVENTS.LEADERBOARD_UPDATE, {
    leaderboard,
  });

  return Response.json({ leaderboard });
}
