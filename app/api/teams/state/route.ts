import { NextRequest, NextResponse } from "next/server";

import { resolveAuthenticatedUserSession } from "@/features/pokedex/server/auth-session";
import { deleteStoredTeam, getStoredTeams, saveTeam } from "@/features/pokedex/server/repository";
import type { PokemonTeamMemberDraft } from "@/features/pokedex/types";
import { sanitizeTeamFormat, sanitizeTeamMode } from "@/features/pokedex/utils";

type TeamAction = "save" | "delete";

export async function GET(request: NextRequest) {
  try {
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
    }

    const teamOwner = { ownerType: "user" as const, userId: session.userId };
    const teams = await getStoredTeams(teamOwner);

    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
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
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
    }

    const teamOwner = { ownerType: "user" as const, userId: session.userId };

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

        return NextResponse.json(result);
      }
      case "delete": {
        if (!Number.isInteger(body.teamId)) {
          return NextResponse.json({ error: "teamId is required" }, { status: 400 });
        }

        const teams = await deleteStoredTeam(teamOwner, Number(body.teamId));

        return NextResponse.json({ teams });
      }
      default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to save team state" }, { status: 500 });
  }
}
