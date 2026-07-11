import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const formData = await request.formData();
  const name = formValue(formData, "name");
  const email = formValue(formData, "email").toLowerCase();
  const password = formValue(formData, "password");
  if (name.length < 2) return redirectWithMessage(request, "/cadastro", "erro", "Informe seu nome.");
  if (!email.includes("@")) return redirectWithMessage(request, "/cadastro", "erro", "Informe um e-mail válido.");
  if (password.length < 8) return redirectWithMessage(request, "/cadastro", "erro", "A senha deve ter pelo menos 8 caracteres.");
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: name }, emailRedirectTo: `${siteUrl}/auth/callback?next=/painel` },
  });
  if (error) return redirectWithMessage(request, "/cadastro", "erro", error.message);
  if (data.session) return NextResponse.redirect(new URL("/painel", request.url), 303);
  return redirectWithMessage(request, "/login", "sucesso", "Conta criada. Confira seu e-mail para confirmar o cadastro.");
}
