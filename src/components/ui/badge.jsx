import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        success: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
        warning: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
        info: "bg-sky-500/15 text-sky-900 dark:text-sky-100",
        outline: "text-foreground border-border bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
