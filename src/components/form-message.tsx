export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div role={error ? "alert" : "status"} className={error ? "form-message form-message-error" : "form-message form-message-success"}>
      {error ?? success}
    </div>
  );
}
