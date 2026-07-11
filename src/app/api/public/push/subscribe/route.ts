import { NextResponse } from "next/server";
import { isAllowedFormOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request) {
  if(!isAllowedFormOrigin(request)) return NextResponse.json({error:"invalid_origin"},{status:403});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body||typeof body.store_id!=="string"||typeof body.endpoint!=="string"||typeof body.p256dh!=="string"||typeof body.auth_key!=="string") return NextResponse.json({error:"invalid_payload"},{status:400});
  const supabase=await createClient();
  const {error}=await supabase.rpc("register_push_subscription",{p_store_id:body.store_id,p_endpoint:body.endpoint,p_p256dh:body.p256dh,p_auth_key:body.auth_key,p_user_agent:request.headers.get("user-agent")??"",p_promotions:body.promotions===true,p_cart_reminders:body.cart_reminders===true});
  if(error) return NextResponse.json({error:"subscription_failed"},{status:400});
  return NextResponse.json({ok:true});
}
