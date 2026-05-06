import { cn } from "@/lib/utils";

const widthClass = {
  default: "max-w-[1120px] 2xl:max-w-[1280px]",
  dashboard: "max-w-[1320px] 2xl:max-w-[1480px]",
  reader: "max-w-[760px] 2xl:max-w-[820px]",
  wide: "max-w-[1280px] 2xl:max-w-[1440px]",
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
        "mx-auto w-full px-5 sm:px-6 xl:px-10 py-5 xl:py-8",
        widthClass[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
