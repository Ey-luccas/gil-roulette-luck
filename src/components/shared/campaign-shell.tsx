import type { ReactNode } from "react";

type CampaignShellProps = {
  children: ReactNode;
};

export function CampaignShell({ children }: CampaignShellProps) {
  return <main className="campaign-shell">{children}</main>;
}
