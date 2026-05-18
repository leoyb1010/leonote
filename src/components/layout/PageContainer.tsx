import { cn } from "@/lib/utils";

const widthClass = {
  default: "max-w-[1120px] 2xl:max-w-[1280px]",
  dashboard: "max-w-[1440px] 2xl:max-w-[1680px]",
  reader: "max-w-[760px] 2xl:max-w-[820px]",
  wide: "max-w-[1480px] 2xl:max-w-[1760px]",
  form: "max-w-[720px]",
  ai: "max-w-[960px] 2xl:max-w-[1120px]",
  full: "max-w-none",
} as const;

type PageContainerProps = {
  width?: keyof typeof widthClass;
  className?: string;
  children: React.ReactNode;
};

export function PageContainer({
  width = "default",
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 py-4 sm:px-6 sm:py-5 xl:px-8 xl:py-8 2xl:px-10",
        widthClass[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
