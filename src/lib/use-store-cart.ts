"use client";

import { useEffect, useState } from "react";

export type CartSelection = { productId:string; variantId?:string; options?:{name:string;value:string}[]; unitPriceCents?:number; stockQuantity?:number|null };
type StoredCart = { store_slug:string; updated_at:string; items:Record<string,number>; selections?:Record<string,CartSelection> };

export function useStoreCart(storeSlug:string,storeId?:string) {
  const [cart,setCart]=useState<Record<string,number>>({});
  const [selections,setSelections]=useState<Record<string,CartSelection>>({});
  const [hydrated,setHydrated]=useState(false);
  const [restored,setRestored]=useState(false);
  const storageKey=`novam-cart:${storeSlug}`;

  useEffect(()=>{
    try {
      const raw=localStorage.getItem(storageKey);
      if(raw){const saved=JSON.parse(raw) as StoredCart;if(saved.store_slug===storeSlug&&saved.items&&Object.keys(saved.items).length){window.setTimeout(()=>{setCart(saved.items);setSelections(saved.selections??Object.fromEntries(Object.keys(saved.items).map(id=>[id,{productId:id}])));setRestored(true);setHydrated(true);},0);return;}}
    } catch { localStorage.removeItem(storageKey); }
    window.setTimeout(()=>setHydrated(true),0);
  },[storageKey,storeSlug]);

  useEffect(()=>{
    if(!hydrated)return;
    if(Object.keys(cart).length===0){localStorage.removeItem(storageKey);return;}
    const payload:StoredCart={store_slug:storeSlug,updated_at:new Date().toISOString(),items:cart,selections};
    localStorage.setItem(storageKey,JSON.stringify(payload));
  },[cart,hydrated,selections,storageKey,storeSlug]);

  useEffect(()=>{
    if(!hydrated||!storeId)return;
    const timeout=window.setTimeout(()=>{
      const tokenKey=`novam-cart-token:${storeSlug}`;
      const anonymousToken=localStorage.getItem(tokenKey)??crypto.randomUUID(); localStorage.setItem(tokenKey,anonymousToken);
      const items=Object.entries(cart).map(([key,quantity])=>({product_id:selections[key]?.productId??key,variant_id:selections[key]?.variantId??null,quantity}));
      void fetch("/api/public/cart",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({store_id:storeId,anonymous_token:anonymousToken,items})});
    },700);
    return()=>window.clearTimeout(timeout);
  },[cart,hydrated,selections,storeId,storeSlug]);

  const changeQuantity=(id:string,delta:number)=>setCart(current=>{const quantity=(current[id]??0)+delta;if(quantity<=0){const next={...current};delete next[id];setSelections(values=>{const updated={...values};delete updated[id];return updated;});return next;}return {...current,[id]:quantity};});
  const remove=(id:string)=>{setCart(current=>{const next={...current};delete next[id];return next;});setSelections(current=>{const next={...current};delete next[id];return next;});};
  const clear=()=>{setCart({});setSelections({});setRestored(false);};
  const add=(selection:CartSelection,quantity=1)=>{const key=selection.variantId??selection.productId;setSelections(current=>({...current,[key]:selection}));setCart(current=>({...current,[key]:(current[key]??0)+quantity}));};
  const toggle=(id:string,selection:CartSelection={productId:id})=>{if(cart[id])remove(id);else add(selection);};
  const dismissRestored=()=>setRestored(false);
  return {cart,selections,changeQuantity,remove,clear,toggle,add,restored,dismissRestored,hydrated};
}
