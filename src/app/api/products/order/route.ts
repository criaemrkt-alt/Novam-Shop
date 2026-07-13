import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request) {
  if(!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida",{status:403});
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
  if(!user) return redirectWithMessage(request,"/login","erro","Sua sessão expirou.");
  const form=await request.formData();const id=formValue(form,"id");const direction=formValue(form,"direction");
  if(!id||!["up","down"].includes(direction)) return redirectWithMessage(request,"/painel/produtos","erro","Movimento inválido.");
  const {error}=await supabase.rpc("move_owned_product",{p_product_id:id,p_direction:direction});
  return redirectWithMessage(request,"/painel/produtos",error?"erro":"sucesso",error?"Não foi possível alterar a ordem.":"Ordem dos produtos atualizada.");
}
