import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { RequireAdmin } from "@/components/guards/RequireAdmin";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { HomeLayout } from "@/components/layouts";

export function AnalyticsPage() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <HomeLayout>
          <AnalyticsDashboard />
        </HomeLayout>
      </RequireAdmin>
    </RequireAuth>
  );
}
