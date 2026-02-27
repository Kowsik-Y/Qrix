import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId, email } = await req.json();

  if (!email || !gameId) {
    return Response.json({ error: "Missing game ID or email" }, { status: 400 });
  }
  
  const game = await prisma.game.findUnique({
    where: { id: gameId }
  });

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.hostId !== session.user.id) {
    return Response.json({ error: "Only the host can share this game" }, { status: 403 });
  }

  const userToShare = await prisma.user.findUnique({
    where: { email }
  });

  if (!userToShare) {
    return Response.json({ error: "User with this email not found" }, { status: 404 });
  }

  // Add user to sharedWith
  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      sharedWith: {
        connect: { id: userToShare.id }
      }
    }
  });

  return Response.json({ success: true, game: updatedGame });
}
