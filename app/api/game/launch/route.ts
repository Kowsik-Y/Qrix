import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { editCode } = await req.json();

  const game = await prisma.game.findUnique({
    where: { editCode },
    include: { questions: true },
  });

  if (!game) return Response.json({ error: "Game not found" }, { status: 404 });
  if (game.hostId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  // Generate a fresh 6-digit code for this session
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const gameSession = await prisma.gameSession.create({
    data: {
      code,
      gameId: game.id,
    },
  });

  return Response.json({ code: gameSession.code, sessionId: gameSession.id });
}
