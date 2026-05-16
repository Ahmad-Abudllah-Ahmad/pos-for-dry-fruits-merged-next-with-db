import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { HomeLayout } from "@/components/layouts";

export function AnalyticsPage() {
  return (
    <RequireAuth>
      <HomeLayout>
        <AnalyticsDashboard />
      </HomeLayout>
    </RequireAuth>
  );
}
