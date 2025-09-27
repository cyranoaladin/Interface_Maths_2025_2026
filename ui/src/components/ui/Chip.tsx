import { cn } from "../../utils/cn";
export function Chip({ active = false, className, children, ...props }: any) {
  return (
    <button
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full border",
        active ? "border-cyan-400 shadow-[0_0_0_2px_rgba(6,182,212,.18)]" : "border-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
