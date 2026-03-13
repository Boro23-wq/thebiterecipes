"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cookSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function startCookSession(
  recipeId: string,
  totalSteps: number,
  servingsUsed: number,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [session] = await db
    .insert(cookSessions)
    .values({
      userId,
      recipeId,
      status: "started",
      totalSteps,
      lastStepReached: 0,
      servingsUsed,
    })
    .returning({ id: cookSessions.id });

  return session.id;
}

export async function updateCookSession(
  sessionId: string,
  data: {
    status?: "completed" | "abandoned";
    lastStepReached?: number;
    durationSeconds?: number;
  },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(cookSessions)
    .set({
      ...data,
      ...(data.status === "completed" ? { completedAt: new Date() } : {}),
    })
    .where(
      and(eq(cookSessions.id, sessionId), eq(cookSessions.userId, userId)),
    );
}
