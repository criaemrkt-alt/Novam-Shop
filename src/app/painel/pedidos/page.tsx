import { redirect } from "next/navigation";
import { FormMessage } from "@/components/form-message";
import { formatMoney } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

const statusLabels = { new:"Novo", confirmed:"Confirmado", completed:"Concluído", cancelled:"Cancelado" } as const;
type Status = keyof typeof statusLabels;
type Order = { id:string; order_number:number; status:Status; customer_name:string; customer_phone:string; total_cents:number; created_at:string; order_items:{ id:string; product_name:string; quantity:number; line_total_cents:number }[] };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient(); const { data:{ user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data:store } = await supabase.from("stores").select("id").eq("owner_id",user.id).maybeSingle(); if (!store) redirect("/painel?erro=Crie+sua+loja+primeiro.");
  const { data } = await supabase.from("orders").select("id, order_number, status, customer_name, customer_phone, total_cents, created_at, order_items(id, product_name, quantity, line_total_cents)").eq("store_id",store.id).order("created_at",{ascending:false});
  const orders=(data??[]) as unknown as Order[]; const message=await searchParams;
  return <div className="dashboard-content subpage-content">
    <div className="dashboard-topbar"><div><p>Atendimento</p><h1>Pedidos</h1></div><div className="catalog-count"><strong>{orders.filter(order=>order.status==="new").length}</strong><span>novos</span></div></div>
    <p className="dashboard-intro">Acompanhe cada solicitação e mantenha o atendimento organizado até a conclusão.</p><FormMessage error={message.erro} success={message.sucesso} />
    <div className="orders-board"><div className="orders-head"><span>Pedido</span><span>Cliente</span><span>Itens</span><span>Total</span><span>Status</span></div>
      {orders.length===0 ? <div className="empty-state orders-empty"><span>00</span><h2>Os pedidos aparecerão aqui.</h2><p>Quando um cliente finalizar uma compra, você poderá acompanhar e atualizar o atendimento nesta tela.</p></div> : orders.map(order=><article key={order.id}>
        <div><small>#{String(order.order_number).padStart(4,"0")}</small><strong>{new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(order.created_at))}</strong></div>
        <div><strong>{order.customer_name}</strong><small>{order.customer_phone}</small></div><div><strong>{order.order_items.reduce((sum,item)=>sum+item.quantity,0)} itens</strong><small>{order.order_items[0]?.product_name || "Pedido"}</small></div><div><strong>{formatMoney(order.total_cents)}</strong></div>
        <form action="/api/orders/status" method="post"><input type="hidden" name="id" value={order.id}/><select name="status" defaultValue={order.status} aria-label={`Status do pedido ${order.order_number}`}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button type="submit">Salvar</button></form>
      </article>)}</div>
  </div>;
}
