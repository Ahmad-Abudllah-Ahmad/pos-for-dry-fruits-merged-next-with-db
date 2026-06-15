import { AdminItemsPage } from "@/components/admin/items/AdminItemsPage";
import { RequireAdmin } from "@/components/guards/RequireAdmin";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { HomeLayout } from "@/components/layouts";

export function AdminItemsRoute() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <HomeLayout>
          <AdminItemsPage />
        </HomeLayout>
      </RequireAdmin>
    </RequireAuth>
  );
}
