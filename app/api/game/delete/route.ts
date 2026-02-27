import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { editCode } = await req.json();

  const game = await prisma.game.findUnique({ where: { editCode } });
  if (!game) return Response.json({ error: "Game not found" }, { status: 404 });
  if (game.hostId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.game.delete({ where: { id: game.id } });

  return Response.json({ success: true });
}
