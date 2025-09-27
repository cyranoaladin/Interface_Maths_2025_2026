import { cn } from "../../utils/cn";
export function Badge({ className, children }: any){return (<span className={cn("inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border border-slate-200 bg-white", className)}>{children}</span>)}
