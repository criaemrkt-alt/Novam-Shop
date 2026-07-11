"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const withMessage = (path: string, key: "erro" | "sucesso", message: string) => `${path}?${key}=${encodeURIComponent(message)}`;

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (!email || !password) redirect(withMessage("/login", "erro", "Preencha e-mail e senha."));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(withMessage("/login", "erro", "E-mail ou senha inválidos."));
  redirect("/painel");
}

export async function signup(formData: FormData) {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (name.length < 2) redirect(withMessage("/cadastro", "erro", "Informe seu nome."));
  if (!email.includes("@")) redirect(withMessage("/cadastro", "erro", "Informe um e-mail válido."));
  if (password.length < 8) redirect(withMessage("/cadastro", "erro", "A senha deve ter pelo menos 8 caracteres."));

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name }, emailRedirectTo: `${siteUrl}/auth/callback?next=/painel` },
  });
  if (error) redirect(withMessage("/cadastro", "erro", error.message));
  if (data.session) redirect("/painel");
  redirect(withMessage("/login", "sucesso", "Conta criada. Confira seu e-mail para confirmar o cadastro."));
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!email.includes("@")) redirect(withMessage("/recuperar-senha", "erro", "Informe um e-mail válido."));
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/nova-senha` });
  redirect(withMessage("/login", "sucesso", "Se o e-mail estiver cadastrado, você receberá o link de recuperação."));
}

export async function updatePassword(formData: FormData) {
  const password = value(formData, "password");
  if (password.length < 8) redirect(withMessage("/nova-senha", "erro", "A senha deve ter pelo menos 8 caracteres."));
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(withMessage("/nova-senha", "erro", "O link expirou. Solicite uma nova recuperação."));
  redirect(withMessage("/login", "sucesso", "Senha atualizada. Entre com sua nova senha."));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
