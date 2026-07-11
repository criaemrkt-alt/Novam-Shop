import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const formData = await request.formData();
  const email = formValue(formData, "email").toLowerCase();
  const password = formValue(formData, "password");
  if (!email || !password) return redirectWithMessage(request, "/login", "erro", "Preencha e-mail e senha.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirectWithMessage(request, "/login", "erro", "E-mail ou senha inválidos.");
  return NextResponse.redirect(new URL("/painel", request.url), 303);
}
