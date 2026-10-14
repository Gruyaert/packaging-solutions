import type { ReactNode } from "react";

export function WorkspacePanel({ children, className = "", title, description }: { children: ReactNode; className?: string; title?: string; description?: string }) {
  return <section className={`min-w-0 max-w-full rounded-2xl border bg-card shadow-sm ${className}`}>
    {(title || description) && <header className="border-b px-4 py-3 sm:px-5"><div className="min-w-0">{title && <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>}{description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}</div></header>}
    {children}
  </section>;
}
