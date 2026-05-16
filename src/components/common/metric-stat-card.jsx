import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/card";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {{ label: string; value: string; sub?: string; icon?: import("lucide-react").LucideIcon; loading?: boolean; className?: string }} p
 */
export function MetricStatCard({ label, value, sub, icon: Icon, loading, className }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-2xl font-semibold tabular-nums tracking-tight [font-family:var(--font-outfit),system-ui,sans-serif]">
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
