import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const editCode = req.nextUrl.searchParams.get("editCode");
  if (!editCode)
    return Response.json({ error: "editCode required" }, { status: 400 });

  const game = await prisma.game.findUnique({
    where: { editCode },
    include: {
      gameSessions: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { players: true } },
          players: {
            orderBy: { score: "desc" },
            take: 1,
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!game)
    return Response.json({ error: "Game not found" }, { status: 404 });
  if (game.hostId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const history = game.gameSessions.map((gs) => ({
    id: gs.id,
    code: gs.code,
    status: gs.status,
    createdAt: gs.createdAt,
    playerCount: gs._count.players,
    topScorer: gs.players[0]
      ? { name: gs.players[0].user.name, score: gs.players[0].score }
      : null,
  }));

  return Response.json({ title: game.title, editCode: game.editCode, history });
}
