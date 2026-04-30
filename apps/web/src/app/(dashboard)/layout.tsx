export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-[240px] shrink-0 border-r bg-card md:block">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-semibold text-teal-700">CRM</span>
        </div>
        <nav className="p-3 text-sm text-muted-foreground">
          Sidebar coming in next step
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center border-b bg-card px-4">
          <span className="text-sm text-muted-foreground">Header coming in next step</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
