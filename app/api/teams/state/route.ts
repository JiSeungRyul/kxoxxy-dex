import { NextResponse } from "next/server";

import { deleteStoredTeam, getStoredTeams, saveTeam } from "@/features/pokedex/server/repository";
import type { PokemonTeamMemberDraft } from "@/features/pokedex/types";
import { sanitizeTeamFormat, sanitizeTeamMode } from "@/features/pokedex/utils";

type TeamAction = "save" | "delete";

function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const teams = await getStoredTeams(sessionId);
    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    if (!isValidSessionId(body.sessionId)) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    switch (body.action) {
      case "save": {
        if (!body.team || typeof body.team.name !== "string" || !Array.isArray(body.team.members)) {
          return NextResponse.json({ error: "team payload is required" }, { status: 400 });
        }

        const result = await saveTeam(body.sessionId, {
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

        const teams = await deleteStoredTeam(body.sessionId, Number(body.teamId));
        return NextResponse.json({ teams });
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to save team state" }, { status: 500 });
  }
}
