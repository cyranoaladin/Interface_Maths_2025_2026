import { cn } from "../../utils/cn";
export function Button({ children, variant = "primary", className, ...props }: any) {
  const base =
    "inline-flex items-center px-6 py-3 rounded-xl font-medium transition shadow-md -translate-y-0 hover:-translate-y-1";
  const variants: Record<string, string> = {
    primary: "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-lg",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    neon: "bg-cyan-500 text-white hover:[box-shadow:0_0_12px_rgba(6,182,212,.6)]",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
