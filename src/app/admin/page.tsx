import { redirect } from "next/navigation";

import { isAdminLoggedIn } from "@/lib/auth";

export default async function AdminIndexPage() {
  const loggedIn = await isAdminLoggedIn();
  redirect(loggedIn ? "/admin/dashboard" : "/admin/login");
}
