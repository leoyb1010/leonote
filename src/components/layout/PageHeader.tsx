import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, eyebrow, icon, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4 shadow-[var(--shadow-sm)] sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 gap-3">
          {icon ? (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--material-inset)] text-[var(--primary)]">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <p className="mb-1 text-xs text-[var(--text-muted)]">{eyebrow}</p> : null}
            <h1 className="text-[1.5rem] font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
            {description ? (
              <div className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                {description}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}
