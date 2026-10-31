export function FormSuccess({ message }: { message: string }) {
  return (
    <div className="border p-4">
      <p className="text-sm">{message}</p>
    </div>
  );
}
