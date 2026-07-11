import { NextResponse } from "next/server";
import { isAllowedFormOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request) {
  if(!isAllowedFormOrigin(request)) return NextResponse.json({error:"invalid_origin"},{status:403});
  const body=await request.json().catch(()=>null) as {store_id?:unknown;anonymous_token?:unknown;items?:unknown}|null;
  if(!body||typeof body.store_id!=="string"||typeof body.anonymous_token!=="string"||!Array.isArray(body.items)) return NextResponse.json({error:"invalid_payload"},{status:400});
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("sync_anonymous_cart",{p_store_id:body.store_id,p_anonymous_token:body.anonymous_token,p_items:body.items});
  if(error) return NextResponse.json({error:"cart_sync_failed"},{status:400});
  return NextResponse.json({ok:true,cart:data?.[0]??null});
}
