export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive/70">
      {errors[0]}
    </p>
  );
}
