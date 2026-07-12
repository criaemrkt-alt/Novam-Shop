import { NextResponse } from "next/server";
import { isAllowedFormOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

type CheckoutBody={store_id?:unknown;checkout_token?:unknown;customer_name?:unknown;customer_phone?:unknown;customer_notes?:unknown;items?:unknown};
const messages:Record<string,string>={store_unavailable:"Esta loja está temporariamente indisponível.",invalid_customer:"Informe seu nome completo.",invalid_phone:"Informe um WhatsApp válido com DDD.",invalid_notes:"As observações estão muito longas.",invalid_items:"Revise os produtos da sacola.",invalid_quantity:"Revise as quantidades da sacola.",duplicate_item:"Há produtos duplicados na sacola.",product_unavailable:"Um dos produtos não está mais disponível.",variant_unavailable:"Uma das variações não está mais disponível.",variant_required:"Escolha uma variação antes de finalizar.",stock_unavailable:"A quantidade solicitada não está mais disponível."};

export async function POST(request:Request){
  if(!isAllowedFormOrigin(request))return NextResponse.json({error:"Origem inválida."},{status:403});
  const body=await request.json().catch(()=>null) as CheckoutBody|null;
  if(!body||typeof body.store_id!=="string"||typeof body.checkout_token!=="string"||typeof body.customer_name!=="string"||typeof body.customer_phone!=="string"||typeof body.customer_notes!=="string"||!Array.isArray(body.items))return NextResponse.json({error:"Revise os dados do pedido."},{status:400});
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("create_public_order",{p_store_id:body.store_id,p_checkout_token:body.checkout_token,p_customer_name:body.customer_name,p_customer_phone:body.customer_phone,p_customer_notes:body.customer_notes,p_items:body.items});
  if(error){const key=Object.keys(messages).find(code=>error.message.includes(code));return NextResponse.json({error:key?messages[key]:"Não foi possível registrar o pedido. Tente novamente."},{status:400});}
  return NextResponse.json({order:data});
}
