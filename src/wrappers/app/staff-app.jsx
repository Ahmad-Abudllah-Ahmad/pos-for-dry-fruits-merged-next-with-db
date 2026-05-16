import { UserAppDashboard } from "@/components/app/UserAppDashboard";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { HomeLayout } from "@/components/layouts";

export function StaffAppPage() {
  return (
    <RequireAuth>
      <HomeLayout>
        <UserAppDashboard />
      </HomeLayout>
    </RequireAuth>
  );
}
