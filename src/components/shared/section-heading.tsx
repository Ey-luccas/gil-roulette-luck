import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  kicker?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({
  kicker,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <header className={cn("campaign-header", className)}>
      {kicker ? <p className="campaign-kicker">{kicker}</p> : null}
      <h1 className="campaign-title">{title}</h1>
      {description ? (
        <p className="campaign-description">{description}</p>
      ) : null}
    </header>
  );
}
