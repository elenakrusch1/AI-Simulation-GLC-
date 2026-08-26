interface ComingSoonProps {
  title: string;
  description: string;
}

// Placeholder shell for a route that is guarded and reachable now but
// whose real content lands in a later build stage.
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-brand-950">{title}</h1>
      <p className="mt-2 text-brand-700">{description}</p>
    </div>
  );
}
