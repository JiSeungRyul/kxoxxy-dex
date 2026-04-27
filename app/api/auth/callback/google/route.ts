import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthSessionCookie,
  clearAuthSessionCookie,
  clearAuthStateCookie,
  createGoogleAuthSession,
  getAuthMode,
  isInactiveAccountError,
  isValidAuthState,
} from "@/features/pokedex/server/auth-session";

const AUTH_URL = process.env.AUTH_URL?.trim() ?? "http://localhost:3000";

function getReturnUrl(searchParamError?: string | null) {
  const returnUrl = new URL("/", AUTH_URL);

  if (searchParamError) {
    returnUrl.searchParams.set("authError", searchParamError);
  }

  return returnUrl;
}

function getRecoveredAccountReturnUrl() {
  const returnUrl = new URL("/my", AUTH_URL);
  returnUrl.searchParams.set("accountRestored", "true");
  return returnUrl;
}

function getSetupReturnUrl() {
  const returnUrl = new URL("/my", AUTH_URL);
  returnUrl.searchParams.set("setup", "true");
  return returnUrl;
}

export async function GET(request: NextRequest) {
  const authMode = getAuthMode();

  if (authMode.kind !== "provider" || authMode.provider !== "google") {
    return NextResponse.redirect(getReturnUrl("provider-not-configured"));
  }

  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  if (error) {
    const response = NextResponse.redirect(getReturnUrl(error));
    clearAuthStateCookie(response);
    return response;
  }

  if (!isValidAuthState(request, state)) {
    const response = NextResponse.redirect(getReturnUrl("invalid-state"));
    clearAuthSessionCookie(response);
    clearAuthStateCookie(response);
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(getReturnUrl("missing-code"));
    clearAuthStateCookie(response);
    return response;
  }

  try {
    const { sessionToken, expiresAt, wasRestored, isNewUser } = await createGoogleAuthSession(code);
    const response = NextResponse.redirect(
      wasRestored ? getRecoveredAccountReturnUrl() : isNewUser ? getSetupReturnUrl() : getReturnUrl(),
    );

    applyAuthSessionCookie(response, sessionToken, expiresAt);
    clearAuthStateCookie(response);

    return response;
  } catch (error) {
    const response = NextResponse.redirect(
      getReturnUrl(isInactiveAccountError(error) ? "account-inactive" : "callback-failed"),
    );

    clearAuthSessionCookie(response);
    clearAuthStateCookie(response);

    return response;
  }
}
