import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { editCode, title, questions } = await req.json();

  const game = await prisma.game.findUnique({
    where: { editCode },
    include: { questions: true },
  });

  if (!game) return Response.json({ error: "Game not found" }, { status: 404 });
  if (game.hostId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  // Delete existing questions and recreate
  await prisma.question.deleteMany({ where: { gameId: game.id } });

  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      title,
      questions: {
        create: questions.map(
          (
            q: {
              text: string;
              image?: string;
              optionA: string;
              imageA?: string;
              optionB: string;
              imageB?: string;
              optionC: string;
              imageC?: string;
              optionD: string;
              imageD?: string;
              correct: string;
              timeLimit: number;
            },
            i: number
          ) => ({ ...q, order: i })
        ),
      },
    },
    include: { questions: true },
  });

  return Response.json(updated);
}
