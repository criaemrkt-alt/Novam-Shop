import { NextResponse } from "next/server";

export const formValue = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export function appUrl(request: Request, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? request.url);
}

export function redirectWithMessage(request: Request, path: string, key: "erro" | "sucesso", message: string) {
  const url = appUrl(request, path);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

export function isAllowedFormOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !siteUrl) return true;
  try {
    const requestOrigin = new URL(origin);
    const configuredSite = new URL(siteUrl);
    if (configuredSite.hostname.endsWith(".app.github.dev")) {
      return true;
    }
    return requestOrigin.origin === configuredSite.origin;
  }
  catch { return false; }
}
