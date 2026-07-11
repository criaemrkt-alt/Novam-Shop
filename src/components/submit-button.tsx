"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button-primary w-full disabled:cursor-wait disabled:opacity-70" type="submit" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
