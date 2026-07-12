import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { slugify } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  if (!store) return redirectWithMessage(request, "/painel", "erro", "Crie sua loja primeiro.");
  const formData = await request.formData();
  const action = formValue(formData, "action") || "create";
  const id = formValue(formData, "id");
  const name = formValue(formData, "name");
  if(action!=="create"){
    const {data:category}=await supabase.from("categories").select("id, position, is_active").eq("id",id).eq("store_id",store.id).maybeSingle();
    if(!category)return redirectWithMessage(request,"/painel/produtos","erro","Categoria não encontrada.");
    if(action==="delete"){const {error}=await supabase.from("categories").delete().eq("id",id).eq("store_id",store.id);return redirectWithMessage(request,"/painel/produtos",error?"erro":"sucesso",error?"Não foi possível excluir a categoria.":"Categoria excluída.");}
    if(action==="toggle"){const {error}=await supabase.from("categories").update({is_active:!category.is_active}).eq("id",id).eq("store_id",store.id);return redirectWithMessage(request,"/painel/produtos",error?"erro":"sucesso",error?"Não foi possível alterar a categoria.":"Categoria atualizada.");}
    if(action==="move_up"||action==="move_down"){
      const {data:list}=await supabase.from("categories").select("id, position").eq("store_id",store.id).order("position").order("created_at");const index=list?.findIndex(item=>item.id===id)??-1;const targetIndex=index+(action==="move_up"?-1:1);const target=list?.[targetIndex];
      if(target&&list){for(const [normalizedPosition,item] of list.entries()){if(item.position!==normalizedPosition)await supabase.from("categories").update({position:normalizedPosition}).eq("id",item.id);}await supabase.from("categories").update({position:targetIndex}).eq("id",id);await supabase.from("categories").update({position:index}).eq("id",target.id);}return redirectWithMessage(request,"/painel/produtos","sucesso","Ordem das categorias atualizada.");
    }
    if(action==="update"){
      if(!name||name.length>80)return redirectWithMessage(request,"/painel/produtos","erro","Informe uma categoria com até 80 caracteres.");const {error}=await supabase.from("categories").update({name,slug:slugify(name)}).eq("id",id).eq("store_id",store.id);return redirectWithMessage(request,"/painel/produtos",error?"erro":"sucesso",error?"Não foi possível editar a categoria.":"Categoria editada.");
    }
  }
  if (!name || name.length > 80) return redirectWithMessage(request, "/painel/produtos", "erro", "Informe uma categoria com até 80 caracteres.");
  const {data:last}=await supabase.from("categories").select("position").eq("store_id",store.id).order("position",{ascending:false}).limit(1).maybeSingle();
  const { error } = await supabase.from("categories").insert({ store_id: store.id, name, slug: slugify(name), position:(last?.position??-1)+1 });
  if (error?.code === "23505") return redirectWithMessage(request, "/painel/produtos", "erro", "Essa categoria já existe.");
  if (error) return redirectWithMessage(request, "/painel/produtos", "erro", "Não foi possível criar a categoria.");
  return redirectWithMessage(request, "/painel/produtos", "sucesso", "Categoria criada.");
}
