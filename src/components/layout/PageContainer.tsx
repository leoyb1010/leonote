import { cn } from "@/lib/utils";

const widthClass = {
  default: "max-w-[1040px]",
  reader: "max-w-[760px]",
  wide: "max-w-[1280px]",
  form: "max-w-[720px]",
  ai: "max-w-[880px]",
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
