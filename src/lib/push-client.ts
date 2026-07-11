type PushPreferences={promotions:boolean;cart_reminders:boolean};

function urlBase64ToUint8Array(value:string) {
  const padding="=".repeat((4-value.length%4)%4); const base64=(value+padding).replace(/-/g,"+").replace(/_/g,"/");
  const raw=window.atob(base64); return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)));
}

export function supportsWebPush() {
  return typeof window!=="undefined"&&"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
}

export async function activatePush(storeId:string,preferences:PushPreferences) {
  const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if(!supportsWebPush()||!publicKey) throw new Error("unsupported");
  const permission=await Notification.requestPermission();
  if(permission!=="granted") throw new Error("denied");
  const registration=await navigator.serviceWorker.register("/sw.js");
  const existing=await registration.pushManager.getSubscription();
  const subscription=existing??await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(publicKey)});
  const json=subscription.toJSON();
  const response=await fetch("/api/public/push/subscribe",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({store_id:storeId,endpoint:json.endpoint,p256dh:json.keys?.p256dh,auth_key:json.keys?.auth,...preferences})});
  if(!response.ok) throw new Error("register_failed");
  return subscription;
}
