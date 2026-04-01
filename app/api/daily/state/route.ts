import { NextRequest, NextResponse } from "next/server";

import { applyAnonymousSessionCookie, resolveAnonymousSessionId } from "@/features/pokedex/server/anonymous-session";
import {
  captureDailyEncounter,
  getDailyCollectionState,
  releaseCapturedPokemon,
  rerollDailyEncounter,
  resetDailyEncounterCapture,
} from "@/features/pokedex/server/repository";

type DailyAction = "capture" | "reset" | "reroll" | "release";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { sessionId, shouldSetCookie } = resolveAnonymousSessionId(request, searchParams.get("sessionId"));
  const state = await getDailyCollectionState(sessionId);
  const response = NextResponse.json(state);

  if (shouldSetCookie) {
    applyAnonymousSessionCookie(response, sessionId);
  }

  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    sessionId?: string;
    action?: DailyAction;
    nationalDexNumber?: number;
  };
  const { sessionId, shouldSetCookie } = resolveAnonymousSessionId(request, body.sessionId);

  let state;

  switch (body.action) {
    case "capture":
      state = await captureDailyEncounter(sessionId);
      break;
    case "reset":
      state = await resetDailyEncounterCapture(sessionId);
      break;
    case "reroll":
      state = await rerollDailyEncounter(sessionId);
      break;
    case "release":
      if (!Number.isInteger(body.nationalDexNumber)) {
        return NextResponse.json({ error: "nationalDexNumber is required" }, { status: 400 });
      }

      {
        const nationalDexNumber = Number(body.nationalDexNumber);
        state = await releaseCapturedPokemon(sessionId, nationalDexNumber);
      }
      break;
    default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const response = NextResponse.json(state);

  if (shouldSetCookie) {
    applyAnonymousSessionCookie(response, sessionId);
  }

  return response;
}
