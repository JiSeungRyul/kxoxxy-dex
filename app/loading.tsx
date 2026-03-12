export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] items-center px-8 py-16">
      <div className="w-full rounded-[2rem] border border-ink/10 bg-panel p-10 shadow-card">
        <div className="h-8 w-64 animate-pulse rounded-full bg-sand" />
        <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-sand/70" />
        <div className="mt-10 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-2xl bg-sand/70" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-sand/50" />
          ))}
        </div>
      </div>
    </main>
  );
}

