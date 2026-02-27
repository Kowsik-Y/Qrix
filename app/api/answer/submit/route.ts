import { prisma } from "@/lib/db";
import { pusherServer, gameChannel, EVENTS } from "@/lib/pusher";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId, selected, timeTaken, sessionCode } = await req.json();

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question)
    return Response.json({ error: "Question not found" }, { status: 404 });

  // Find the GameSession
  const gameSession = sessionCode
    ? await prisma.gameSession.findUnique({ where: { code: sessionCode } })
    : null;

  // Check if already answered — scoped to this game session
  const existing = await prisma.answer.findFirst({
    where: {
      questionId,
      userId: session.user.id,
      ...(gameSession ? { gameSessionId: gameSession.id } : {}),
    },
  });
  if (existing)
    return Response.json({ error: "Already answered" }, { status: 400 });

  const isCorrect = question.correct === selected;
  const timeLimit = question.timeLimit;
  const clampedTime = Math.max(0, Math.min(timeTaken, timeLimit));

  // ── Kahoot-style scoring ──
  // Base: 1000 points scaled by how fast you answered
  // Formula: round(1000 * (1 - timeTaken/timeLimit / 2))
  // This gives 500–1000 points for correct answers depending on speed
  let basePoints = 0;
  let speedBonus = 0;
  let streakBonus = 0;
  let totalPoints = 0;

  if (isCorrect) {
    // Speed factor: 1.0 (instant) to 0.0 (at time limit)
    const speedFactor = 1 - clampedTime / timeLimit;

    // Base points: 500 for answering correctly
    basePoints = 500;

    // Speed bonus: up to 500 extra for fast answers
    speedBonus = Math.round(500 * speedFactor);

    // Streak bonus: check consecutive correct answers in this session
    if (gameSession) {
      const previousAnswers = await prisma.answer.findMany({
        where: { userId: session.user.id, gameSessionId: gameSession.id },
        orderBy: { createdAt: "desc" },
      });

      // Count consecutive correct answers (streak)
      let streak = 0;
      for (const ans of previousAnswers) {
        if (ans.isCorrect) streak++;
        else break;
      }

      // Streak multiplier: +100 for each consecutive correct (max +500)
      streakBonus = Math.min(streak * 100, 500);
    }

    totalPoints = basePoints + speedBonus + streakBonus;
  }

  await prisma.answer.create({
    data: {
      questionId,
      userId: session.user.id,
      gameSessionId: gameSession?.id,
      selected,
      isCorrect,
      timeTaken: clampedTime,
      points: totalPoints,
    },
  });

  if (isCorrect && gameSession) {
    await prisma.playerSession.updateMany({
      where: { userId: session.user.id, sessionId: gameSession.id },
      data: { score: { increment: totalPoints } },
    });
  }

  if (sessionCode && gameSession) {
    await pusherServer.trigger(
      gameChannel(sessionCode),
      EVENTS.PLAYER_ANSWERED,
      {
        userId: session.user.id,
        isCorrect,
        points: totalPoints,
      }
    );

    // Broadcast answer distribution for this question
    const allAnswers = await prisma.answer.findMany({
      where: { questionId, gameSessionId: gameSession.id },
      select: { selected: true },
    });

    const optionCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const a of allAnswers) {
      if (optionCounts[a.selected] !== undefined) optionCounts[a.selected]++;
    }

    await pusherServer.trigger(
      gameChannel(sessionCode),
      EVENTS.ANSWER_STATS,
      {
        questionId,
        optionCounts,
        totalAnswered: allAnswers.length,
        correctOption: question.correct,
      }
    );
  }

  // Build response with scoring breakdown
  const correctKey = `option${question.correct}` as keyof typeof question;
  const correctText = (question[correctKey] as string) || question.correct;

  return Response.json({
    isCorrect,
    points: totalPoints,
    basePoints,
    speedBonus,
    streakBonus,
    timeTaken: clampedTime,
    timeLimit,
    correct: question.correct,
    correctText,
  });
}
