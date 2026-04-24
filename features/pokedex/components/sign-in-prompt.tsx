type SignInPromptProps = {
  title: string;
  description: string;
};

export function SignInPrompt({ title, description }: SignInPromptProps) {
  return (
    <main className="min-h-full w-full">
      <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
        <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">{title}</p>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <a
          href="/api/auth/sign-in"
          className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
        >
          로그인하기
        </a>
      </section>
    </main>
  );
}
