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
        "mb-6 flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5",
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
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
