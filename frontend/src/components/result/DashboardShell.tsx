import { type ReactNode } from "react";

interface DashboardShellProps {
  hero: ReactNode;
  alert?: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
  footer?: ReactNode;
}

/**
 * 12-col dashboard layout for the result page.
 * - On `lg+`: main(8) + sticky sidebar(4)
 * - Below `lg`: single column with main → sidebar stacked
 */
export function DashboardShell({
  hero,
  alert,
  main,
  sidebar,
  footer,
}: DashboardShellProps) {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      {hero}
      {alert}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">{main}</div>
        <aside className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          {sidebar}
        </aside>
      </div>
      {footer}
    </section>
  );
}
