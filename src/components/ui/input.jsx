import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Input = React.forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full min-w-0 rounded-md border border-border bg-elevated px-3 py-1 text-sm text-foreground shadow-sm",
          "placeholder:text-muted-foreground/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--t-ring) focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
