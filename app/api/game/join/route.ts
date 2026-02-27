import { prisma } from "@/lib/db";
import { pusherServer, gameChannel, EVENTS } from "@/lib/pusher";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();

  const gameSession = await prisma.gameSession.findUnique({
    where: { code },
  });
  if (!gameSession)
    return Response.json({ error: "Game not found" }, { status: 404 });
  if (gameSession.status !== "waiting")
    return Response.json({ error: "Game already started" }, { status: 400 });

  await prisma.playerSession.upsert({
    where: {
      userId_sessionId: {
        userId: session.user.id,
        sessionId: gameSession.id,
      },
    },
    update: {},
    create: { userId: session.user.id, sessionId: gameSession.id },
  });

  await pusherServer.trigger(gameChannel(code), EVENTS.PLAYER_JOINED, {
    userId: session.user.id,
    name: session.user.name,
    image: session.user.image,
  });

  return Response.json({ success: true, sessionId: gameSession.id });
}
