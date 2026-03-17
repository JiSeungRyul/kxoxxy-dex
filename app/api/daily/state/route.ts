import { NextResponse } from "next/server";

import {
  captureDailyEncounter,
  getDailyCollectionState,
  rerollDailyEncounter,
  resetDailyEncounterCapture,
} from "@/features/pokedex/server/repository";

type DailyAction = "capture" | "reset" | "reroll";

function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const state = await getDailyCollectionState(sessionId);
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    action?: DailyAction;
  };

  if (!isValidSessionId(body.sessionId)) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  let state;

  switch (body.action) {
    case "capture":
      state = await captureDailyEncounter(body.sessionId);
      break;
    case "reset":
      state = await resetDailyEncounterCapture(body.sessionId);
      break;
    case "reroll":
      state = await rerollDailyEncounter(body.sessionId);
      break;
    default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  return NextResponse.json(state);
}
