import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { RequireAdmin } from "@/components/guards/RequireAdmin";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { HomeLayout } from "@/components/layouts";

export function AdminPage() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <HomeLayout>
          <AdminDashboard />
        </HomeLayout>
      </RequireAdmin>
    </RequireAuth>
  );
}
