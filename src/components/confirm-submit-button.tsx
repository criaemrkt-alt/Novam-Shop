"use client";

export function ConfirmSubmitButton({children,message,className,formAction,name,value}:{children:React.ReactNode;message:string;className?:string;formAction?:string;name?:string;value?:string}){
  return <button type="submit" className={className} formAction={formAction} name={name} value={value} onClick={event=>{if(!window.confirm(message))event.preventDefault();}}>{children}</button>;
}
