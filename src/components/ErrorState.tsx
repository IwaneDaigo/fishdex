export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-coral/30 bg-white p-5 text-sm font-bold text-coral">
      {message}
    </div>
  );
}
