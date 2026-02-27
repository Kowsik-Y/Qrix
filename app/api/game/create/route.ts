import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

function generateEditCode(): string {
  return randomBytes(4).toString("hex"); // 8-char hex string
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { title, questions } = await req.json();
  const editCode = generateEditCode();

  const game = await prisma.game.create({
    data: {
      editCode,
      title,
      hostId: session.user.id,
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

  return Response.json(game);
}
