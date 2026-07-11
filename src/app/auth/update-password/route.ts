import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const formData = await request.formData();
  const password = formValue(formData, "password");
  if (password.length < 8) return redirectWithMessage(request, "/nova-senha", "erro", "A senha deve ter pelo menos 8 caracteres.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return redirectWithMessage(request, "/nova-senha", "erro", "O link expirou. Solicite uma nova recuperação.");
  return redirectWithMessage(request, "/login", "sucesso", "Senha atualizada. Entre com sua nova senha.");
}
