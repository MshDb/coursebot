export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="w-full max-w-md space-y-8">
        {/* We can add a logo here later if needed */}
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight">CourseBot</h1>
          <p className="mt-2 text-sm text-muted-foreground">SaaS Platform for Influencers</p>
        </div>

        {children}
      </div>
    </div>
  );
}
