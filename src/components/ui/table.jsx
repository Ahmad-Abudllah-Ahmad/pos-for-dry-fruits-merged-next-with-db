import { cn } from "@/lib/utils/cn";

function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table
        className={cn("w-full caption-bottom text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-border/80 transition-colors hover:bg-muted/40",
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
        "h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return <td className={cn("p-3 align-middle", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={className} {...props} />;
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
