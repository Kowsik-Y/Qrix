import Pusher from "pusher";
import PusherJs from "pusher-js";

// Server-side Pusher instance (Node.js only)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher singleton
let pusherClientInstance: PusherJs | null = null;

export function getPusherClient(): PusherJs {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClientInstance;
}

// Channel name helper
export const gameChannel = (code: string) => `game-${code}`;

// Event names
export const EVENTS = {
  PLAYER_JOINED: "player_joined",
  GAME_STARTED: "game_started",
  NEW_QUESTION: "new_question",
  LEADERBOARD_UPDATE: "leaderboard_update",
  GAME_ENDED: "game_ended",
  PLAYER_ANSWERED: "player_answered",
  ANSWER_STATS: "answer_stats",
} as const;
