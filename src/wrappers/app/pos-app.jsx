import { PosPage } from "@/components/pos/PosPage";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { HomeLayout } from "@/components/layouts";

export function PosAppPage() {
  return (
    <RequireAuth>
      <HomeLayout>
        <PosPage />
      </HomeLayout>
    </RequireAuth>
  );
}
