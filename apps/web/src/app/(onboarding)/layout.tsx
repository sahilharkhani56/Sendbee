export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-background">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-8 h-1 w-full rounded-full bg-muted">
          <div className="h-1 w-1/3 rounded-full bg-teal-700 transition-all" />
        </div>
        {children}
      </div>
    </div>
  );
}
