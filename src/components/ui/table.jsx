import { cn } from "@/lib/utils/cn";

function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-elevated">
      <table
        className={cn("w-full border-collapse caption-bottom text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead className={cn("bg-muted/55 [&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/30",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-11 border-r border-border px-3 text-left align-middle text-xs font-semibold text-muted-foreground last:border-r-0",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return <td className={cn("border-r border-border p-3 align-middle last:border-r-0", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={className} {...props} />;
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
