import { NextResponse } from "next/server";

export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

export function corsHeaders(extra?: HeadersInit): HeadersInit {
  const base: HeadersInit = {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };
  return { ...(extra || {}), ...base };
}

export function jsonWithCors(data: any, init?: ResponseInit) {
  const headers = corsHeaders(init?.headers);
  return NextResponse.json(data, { ...init, headers });
}

export function optionsWithCors() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}