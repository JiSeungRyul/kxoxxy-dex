import { NextRequest, NextResponse } from "next/server";

import { resolveAuthenticatedUserSession } from "@/features/pokedex/server/auth-session";
import {
  captureDailyEncounter,
  getDailyCollectionState,
  releaseCapturedPokemon,
  rerollDailyEncounter,
  resetDailyEncounterCapture,
} from "@/features/pokedex/server/repository";

type DailyAction = "capture" | "reset" | "reroll" | "release";

export async function GET(request: NextRequest) {
  const session = await resolveAuthenticatedUserSession(request);

  if (!session) {
    return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
  }

  const state = await getDailyCollectionState({ ownerType: "user", userId: session.userId });

  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    action?: DailyAction;
    nationalDexNumber?: number;
  };
  const session = await resolveAuthenticatedUserSession(request);

  if (!session) {
    return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
  }

  const dailyOwner = { ownerType: "user" as const, userId: session.userId };

  let state;

  switch (body.action) {
    case "capture":
      state = await captureDailyEncounter(dailyOwner);
      break;
    case "reset":
      state = await resetDailyEncounterCapture(dailyOwner);
      break;
    case "reroll":
      state = await rerollDailyEncounter(dailyOwner);
      break;
    case "release":
      if (!Number.isInteger(body.nationalDexNumber)) {
        return NextResponse.json({ error: "nationalDexNumber is required" }, { status: 400 });
      }

      {
        const nationalDexNumber = Number(body.nationalDexNumber);
        state = await releaseCapturedPokemon(dailyOwner, nationalDexNumber);
      }
      break;
    default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  return NextResponse.json(state);
}
