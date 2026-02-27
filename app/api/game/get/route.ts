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
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!game)
    return Response.json({ error: "Game not found" }, { status: 404 });

  return Response.json(game);
}
