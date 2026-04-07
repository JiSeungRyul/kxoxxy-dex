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

function getReturnUrl(request: NextRequest, searchParamError?: string | null) {
  const returnUrl = new URL("/", request.url);

  if (searchParamError) {
    returnUrl.searchParams.set("authError", searchParamError);
  }

  return returnUrl;
}

function getRecoveredAccountReturnUrl(request: NextRequest) {
  const returnUrl = new URL("/my", request.url);
  returnUrl.searchParams.set("accountRestored", "true");
  return returnUrl;
}

export async function GET(request: NextRequest) {
  const authMode = getAuthMode();

  if (authMode.kind !== "provider" || authMode.provider !== "google") {
    return NextResponse.redirect(getReturnUrl(request, "provider-not-configured"));
  }

  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  if (error) {
    const response = NextResponse.redirect(getReturnUrl(request, error));
    clearAuthStateCookie(response);
    return response;
  }

  if (!isValidAuthState(request, state)) {
    const response = NextResponse.redirect(getReturnUrl(request, "invalid-state"));
    clearAuthSessionCookie(response);
    clearAuthStateCookie(response);
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(getReturnUrl(request, "missing-code"));
    clearAuthStateCookie(response);
    return response;
  }

  try {
    const { sessionToken, expiresAt, wasRestored } = await createGoogleAuthSession(code);
    const response = NextResponse.redirect(
      wasRestored ? getRecoveredAccountReturnUrl(request) : getReturnUrl(request),
    );

    applyAuthSessionCookie(response, sessionToken, expiresAt);
    clearAuthStateCookie(response);

    return response;
  } catch (error) {
    const response = NextResponse.redirect(
      getReturnUrl(request, isInactiveAccountError(error) ? "account-inactive" : "callback-failed"),
    );

    clearAuthSessionCookie(response);
    clearAuthStateCookie(response);

    return response;
  }
}
