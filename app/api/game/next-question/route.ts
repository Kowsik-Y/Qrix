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
    include: { game: { include: { questions: { orderBy: { order: "asc" } } } } },
  });

  if (!gameSession)
    return Response.json({ error: "Game not found" }, { status: 404 });
  if (gameSession.game.hostId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const questions = gameSession.game.questions;
  const nextIndex = gameSession.currentIndex + 1;
  const question = questions[nextIndex];

  if (!question) {
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

    await prisma.gameSession.update({
      where: { id: gameSession.id },
      data: { status: "ended" },
    });

    await pusherServer.trigger(gameChannel(code), EVENTS.GAME_ENDED, {
      leaderboard,
    });

    return Response.json({ ended: true, leaderboard });
  }

  await prisma.gameSession.update({
    where: { id: gameSession.id },
    data: { currentIndex: nextIndex, status: "active" },
  });

  const { correct: _correct, ...safeQuestion } = question;

  await pusherServer.trigger(gameChannel(code), EVENTS.NEW_QUESTION, {
    question: safeQuestion,
    index: nextIndex,
    total: questions.length,
  });

  return Response.json({ question: safeQuestion, index: nextIndex });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();

  const gameSession = await prisma.gameSession.findUnique({
    where: { code },
    include: { game: { include: { questions: { orderBy: { order: "asc" } } } } },
  });

  if (!gameSession)
    return Response.json({ error: "Game not found" }, { status: 404 });
  if (gameSession.game.hostId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const question = gameSession.game.questions[0];
  if (!question)
    return Response.json({ error: "No questions" }, { status: 400 });

  await prisma.gameSession.update({
    where: { id: gameSession.id },
    data: { currentIndex: 0, status: "active" },
  });

  const { correct: _correct, ...safeQuestion } = question;

  await pusherServer.trigger(gameChannel(code), EVENTS.GAME_STARTED, {});
  await pusherServer.trigger(gameChannel(code), EVENTS.NEW_QUESTION, {
    question: safeQuestion,
    index: 0,
    total: gameSession.game.questions.length,
  });

  return Response.json({ question: safeQuestion, index: 0 });
}
