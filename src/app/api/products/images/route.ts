import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request){
  if(!isAllowedFormOrigin(request))return new NextResponse("Origem inválida",{status:403});
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return redirectWithMessage(request,"/login","erro","Sua sessão expirou.");
  const formData=await request.formData();const productId=formValue(formData,"id");const [action,imageId]=formValue(formData,"image_action").split(":");const back=`/painel/produtos/${productId}`;
  const {data:store}=await supabase.from("stores").select("id").eq("owner_id",user.id).maybeSingle();const {data:product}=await supabase.from("products").select("id").eq("id",productId).eq("store_id",store?.id??"").maybeSingle();if(!product)return redirectWithMessage(request,"/painel/produtos","erro","Produto não encontrado.");
  const {data:images}=await supabase.from("product_images").select("id, storage_path, position").eq("product_id",productId).order("position");const index=images?.findIndex(image=>image.id===imageId)??-1;const image=images?.[index];if(!image)return redirectWithMessage(request,back,"erro","Imagem não encontrada.");
  if(action==="delete"){const {error}=await supabase.from("product_images").delete().eq("id",image.id).eq("product_id",productId);if(!error)await supabase.storage.from("store-assets").remove([image.storage_path]);return redirectWithMessage(request,back,error?"erro":"sucesso",error?"Não foi possível remover a imagem.":"Imagem removida.");}
  const targetIndex=index+(action==="up"?-1:1);const target=images?.[targetIndex];if(target&&images&&(action==="up"||action==="down")){for(const [normalizedPosition,item] of images.entries()){if(item.position!==normalizedPosition)await supabase.from("product_images").update({position:normalizedPosition}).eq("id",item.id);}await supabase.from("product_images").update({position:targetIndex}).eq("id",image.id);await supabase.from("product_images").update({position:index}).eq("id",target.id);return redirectWithMessage(request,back,"sucesso","Ordem das imagens atualizada.");}
  return redirectWithMessage(request,back,"erro","Ação de imagem inválida.");
}
