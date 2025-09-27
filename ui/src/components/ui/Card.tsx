import { cn } from "../../utils/cn";
export function Card({ className, children }: any) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-slate-200 bg-white shadow-md hover:shadow-lg transition",
        className
      )}
    >
      {children}
    </div>
  );
}
