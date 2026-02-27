import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await req.json();

  const originalGame = await prisma.game.findUnique({
    where: { id: gameId },
    include: { questions: true },
  });

  if (!originalGame) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  // Create new editCode
  const editCode = randomBytes(4).toString("hex");

  // Create duplicate game
  const clonedQuestions = originalGame.questions.map((q) => {
    const { id, gameId, ...rest } = q;
    return rest;
  });

  const duplicate = await prisma.game.create({
    data: {
      editCode,
      title: `${originalGame.title || "Game"} (Copy)`,
      hostId: session.user.id,
      questions: {
        create: clonedQuestions,
      },
    },
    include: { questions: true },
  });

  return Response.json(duplicate);
}
