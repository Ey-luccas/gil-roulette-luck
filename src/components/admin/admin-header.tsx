import Link from "next/link";

import { logoutAdminAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AdminHeaderProps = {
  pathname: string;
  username: string;
};

export function AdminHeader({ pathname, username }: AdminHeaderProps) {
  return (
    <Card className="campaign-panel-muted">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/dashboard" className="text-sm font-bold tracking-wide text-foreground">
              GC Conceito Admin
            </Link>
            <Badge variant="outline" className="bg-background/80">
              @{username}
            </Badge>
          </div>
          <AdminNav pathname={pathname} />
        </div>

        <form action={logoutAdminAction}>
          <Button type="submit" variant="outline" size="sm" className="rounded-lg">
            Sair
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
