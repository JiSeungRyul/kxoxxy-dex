import { NextRequest, NextResponse } from "next/server";

import { applyOwnershipCookies, resolveRequestOwnership } from "@/features/pokedex/server/ownership";
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
  const ownership = await resolveRequestOwnership(request, searchParams.get("sessionId"));
  const state = await getDailyCollectionState(
    ownership.ownerType === "user"
      ? { ownerType: "user", userId: ownership.userId }
      : { ownerType: "anonymous", sessionId: ownership.sessionId },
  );
  const response = NextResponse.json(state);

  applyOwnershipCookies(response, ownership);

  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    sessionId?: string;
    action?: DailyAction;
    nationalDexNumber?: number;
  };
  const ownership = await resolveRequestOwnership(request, body.sessionId);
  const dailyOwner =
    ownership.ownerType === "user"
      ? { ownerType: "user" as const, userId: ownership.userId }
      : { ownerType: "anonymous" as const, sessionId: ownership.sessionId };

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

  const response = NextResponse.json(state);

  applyOwnershipCookies(response, ownership);

  return response;
}
