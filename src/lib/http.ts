import { NextResponse } from "next/server";

export const formValue = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export function redirectWithMessage(request: Request, path: string, key: "erro" | "sucesso", message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

export function isAllowedFormOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !siteUrl) return true;
  try {
    const requestOrigin = new URL(origin);
    if (process.env.NODE_ENV === "development" && requestOrigin.hostname.endsWith(".app.github.dev")) {
      return true;
    }
    return requestOrigin.origin === new URL(siteUrl).origin;
  }
  catch { return false; }
}
