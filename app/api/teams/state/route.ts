import { NextRequest, NextResponse } from "next/server";

import { applyOwnershipCookies, resolveRequestOwnership } from "@/features/pokedex/server/ownership";
import { deleteStoredTeam, getStoredTeams, saveTeam } from "@/features/pokedex/server/repository";
import type { PokemonTeamMemberDraft } from "@/features/pokedex/types";
import { sanitizeTeamFormat, sanitizeTeamMode } from "@/features/pokedex/utils";

type TeamAction = "save" | "delete";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownership = await resolveRequestOwnership(request, searchParams.get("sessionId"));
    const teamOwner =
      ownership.ownerType === "user"
        ? { ownerType: "user" as const, userId: ownership.userId }
        : { ownerType: "anonymous" as const, sessionId: ownership.sessionId };
    const teams = await getStoredTeams(teamOwner);
    const response = NextResponse.json({ teams });

    applyOwnershipCookies(response, ownership);

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      action?: TeamAction;
      teamId?: number;
      team?: {
        id?: number | null;
        name?: string;
        format?: string;
        mode?: string;
        members?: PokemonTeamMemberDraft[];
      };
    };
    const ownership = await resolveRequestOwnership(request, body.sessionId);
    const teamOwner =
      ownership.ownerType === "user"
        ? { ownerType: "user" as const, userId: ownership.userId }
        : { ownerType: "anonymous" as const, sessionId: ownership.sessionId };

    switch (body.action) {
      case "save": {
        if (!body.team || typeof body.team.name !== "string" || !Array.isArray(body.team.members)) {
          return NextResponse.json({ error: "team payload is required" }, { status: 400 });
        }

        const result = await saveTeam(teamOwner, {
          id: Number.isInteger(body.team.id) ? Number(body.team.id) : null,
          name: body.team.name,
          format: sanitizeTeamFormat(body.team.format),
          mode: sanitizeTeamMode(body.team.mode),
          members: body.team.members,
        });

        if (!result.savedTeamId) {
          return NextResponse.json({ error: result.error ?? "team could not be saved", teams: result.teams }, { status: 400 });
        }

        const response = NextResponse.json(result);

        applyOwnershipCookies(response, ownership);

        return response;
      }
      case "delete": {
        if (!Number.isInteger(body.teamId)) {
          return NextResponse.json({ error: "teamId is required" }, { status: 400 });
        }

        const teams = await deleteStoredTeam(teamOwner, Number(body.teamId));
        const response = NextResponse.json({ teams });

        applyOwnershipCookies(response, ownership);

        return response;
      }
      default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to save team state" }, { status: 500 });
  }
}
