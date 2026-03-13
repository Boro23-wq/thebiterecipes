import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cookSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const { sessionId, lastStepReached, durationSeconds } =
      await request.json();

    await db
      .update(cookSessions)
      .set({
        status: "abandoned",
        lastStepReached,
        durationSeconds,
      })
      .where(
        and(eq(cookSessions.id, sessionId), eq(cookSessions.userId, userId)),
      );

    return new Response("OK");
  } catch {
    return new Response("Error", { status: 500 });
  }
}
