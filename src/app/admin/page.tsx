import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Admin · wiTTy's Translation Rescue" };

/** Protected by src/proxy.ts; data comes from authorised API routes only. */
export default function AdminPage() {
  return <AdminDashboard />;
}
