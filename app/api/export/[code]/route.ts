import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

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
      players: {
        include: { user: true },
        orderBy: { score: "desc" },
      },
    },
  });

  if (!gameSession)
    return Response.json({ error: "Game not found" }, { status: 404 });

  const questions = gameSession.game.questions;

  const answers = await prisma.answer.findMany({
    where: { questionId: { in: questions.map((q: { id: string }) => q.id) }, gameSessionId: gameSession.id },
  });

  const answerMap: Record<
    string,
    Record<string, { selected: string; isCorrect: boolean; points: number }>
  > = {};
  for (const a of answers) {
    if (!answerMap[a.userId]) answerMap[a.userId] = {};
    answerMap[a.userId][a.questionId] = {
      selected: a.selected,
      isCorrect: a.isCorrect,
      points: a.points,
    };
  }

  const rows = gameSession.players.map(
    (
      ps: {
        userId: string;
        score: number;
        user: { name: string | null; email: string | null };
      },
      idx: number
    ) => {
      const row: Record<string, string | number | boolean> = {
        Rank: idx + 1,
        Name: ps.user.name ?? "",
        Email: ps.user.email ?? "",
        "Total Score": ps.score,
      };

      for (const q of questions) {
        const ans = answerMap[ps.userId]?.[q.id];
        row[`Q${q.order + 1}: ${q.text.slice(0, 40)}`] = ans
          ? `${ans.selected} (${ans.isCorrect ? "✓" : "✗"} ${ans.points}pts)`
          : "No answer";
      }

      return row;
    }
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Quiz Results");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="quiz-${code}-results.xlsx"`,
    },
  });
}
