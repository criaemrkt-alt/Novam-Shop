import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const formData = await request.formData();
  const email = formValue(formData, "email").toLowerCase();
  if (!email.includes("@")) return redirectWithMessage(request, "/recuperar-senha", "erro", "Informe um e-mail válido.");
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/nova-senha` });
  return redirectWithMessage(request, "/login", "sucesso", "Se o e-mail estiver cadastrado, você receberá o link de recuperação.");
}
