import Link from "next/link";

import { cn } from "@/lib/utils";

type AdminNavProps = {
  pathname: string;
};

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/pecas", label: "Peças" },
  { href: "/admin/pecas/new", label: "Nova peça" },
];

export function AdminNav({ pathname }: AdminNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-semibold transition",
            pathname === link.href
              ? "border-primary/35 bg-primary/12 text-primary shadow-sm"
              : "border-border bg-background/80 hover:border-primary/30 hover:bg-primary/8 hover:text-primary"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
