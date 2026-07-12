"use client";

import { useEffect, useState } from "react";

type StoredCart = { store_slug:string; updated_at:string; items:Record<string,number> };

export function useStoreCart(storeSlug:string,storeId?:string) {
  const [cart,setCart]=useState<Record<string,number>>({});
  const [hydrated,setHydrated]=useState(false);
  const [restored,setRestored]=useState(false);
  const storageKey=`novam-cart:${storeSlug}`;

  useEffect(()=>{
    try {
      const raw=localStorage.getItem(storageKey);
      if(raw){const saved=JSON.parse(raw) as StoredCart;if(saved.store_slug===storeSlug&&saved.items&&Object.keys(saved.items).length){window.setTimeout(()=>{setCart(saved.items);setRestored(true);setHydrated(true);},0);return;}}
    } catch { localStorage.removeItem(storageKey); }
    window.setTimeout(()=>setHydrated(true),0);
  },[storageKey,storeSlug]);

  useEffect(()=>{
    if(!hydrated)return;
    if(Object.keys(cart).length===0){localStorage.removeItem(storageKey);return;}
    const payload:StoredCart={store_slug:storeSlug,updated_at:new Date().toISOString(),items:cart};
    localStorage.setItem(storageKey,JSON.stringify(payload));
  },[cart,hydrated,storageKey,storeSlug]);

  useEffect(()=>{
    if(!hydrated||!storeId)return;
    const timeout=window.setTimeout(()=>{
      const tokenKey=`novam-cart-token:${storeSlug}`;
      const anonymousToken=localStorage.getItem(tokenKey)??crypto.randomUUID(); localStorage.setItem(tokenKey,anonymousToken);
      const items=Object.entries(cart).map(([product_id,quantity])=>({product_id,quantity}));
      void fetch("/api/public/cart",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({store_id:storeId,anonymous_token:anonymousToken,items})});
    },700);
    return()=>window.clearTimeout(timeout);
  },[cart,hydrated,storeId,storeSlug]);

  const changeQuantity=(id:string,delta:number)=>setCart(current=>{const quantity=(current[id]??0)+delta;if(quantity<=0){const next={...current};delete next[id];return next;}return {...current,[id]:quantity};});
  const remove=(id:string)=>setCart(current=>{const next={...current};delete next[id];return next;});
  const clear=()=>{setCart({});setRestored(false);};
  const toggle=(id:string)=>setCart(current=>current[id]?Object.fromEntries(Object.entries(current).filter(([key])=>key!==id)):{...current,[id]:1});
  const dismissRestored=()=>setRestored(false);
  return {cart,changeQuantity,remove,clear,toggle,restored,dismissRestored,hydrated};
}
