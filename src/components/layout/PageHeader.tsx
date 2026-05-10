import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          {title}
        </h1>
        {description ? (
          <div className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
    </header>
  );
}
