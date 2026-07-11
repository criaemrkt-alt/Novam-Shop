import { NextResponse } from "next/server";
import { moneyToCents } from "@/lib/catalog";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const actions=["suspend_store","reactivate_store","cancel_account","confirm_payment","update_subscription"];
const plans=["monthly","annual","custom"]; const financial=["trial","active","past_due","suspended","cancelled"];
export async function POST(request:Request) {
  if(!isAllowedFormOrigin(request))return new NextResponse("Origem inválida",{status:403}); const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return redirectWithMessage(request,"/login","erro","Sua sessão expirou."); const {data:isAdmin}=await supabase.rpc("is_master_admin"); if(!isAdmin)return new NextResponse("Acesso negado",{status:403});
  const form=await request.formData(); const storeId=formValue(form,"store_id"); const action=formValue(form,"action"); const back=`/master/lojas/${storeId}`; if(!actions.includes(action))return redirectWithMessage(request,back,"erro","Ação inválida.");
  const plan=formValue(form,"plan"); const financialStatus=formValue(form,"financial_status"); const due=formValue(form,"next_due_at"); const amount=formValue(form,"amount"); const grace=formValue(form,"grace_period_days");
  const {error}=await supabase.rpc("master_update_account",{p_store_id:storeId,p_action:action,p_reason:formValue(form,"reason")||null,p_plan:plans.includes(plan)?plan:null,p_financial_status:financial.includes(financialStatus)?financialStatus:null,p_publication_status:null,p_next_due_at:due?new Date(`${due}T12:00:00Z`).toISOString():null,p_amount_cents:amount?moneyToCents(amount):null,p_payment_method:formValue(form,"payment_method")||null,p_grace_period_days:grace?Number(grace):null,p_internal_notes:formValue(form,"internal_notes")||null});
  if(error)return redirectWithMessage(request,back,"erro","Não foi possível concluir a ação administrativa."); return redirectWithMessage(request,back,"sucesso","Alteração registrada com sucesso.");
}
