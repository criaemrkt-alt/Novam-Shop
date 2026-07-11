import { NextResponse } from "next/server";
import { appUrl, isAllowedFormOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(appUrl(request, "/login"), 303);
}
