import brandIcon from "@/assets/fg-icon.png";
import { cn } from "@/lib/utils";

type Props = {
  collapsed?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
};

export function BrandMark({ collapsed = false, className, title, subtitle }: Props) {
  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <img
        src={brandIcon}
        alt="Ícone Felipe Gloria"
        className={cn("h-8 w-8 rounded-lg object-cover", collapsed && "h-9 w-9")}
        loading="eager"
      />

      {!collapsed ? (
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold text-foreground truncate">
            {title ?? "Felipe Gloria"}
          </div>
          <div className="text-xs text-muted-foreground truncate">{subtitle ?? "felipegloria.site"}</div>
        </div>
      ) : null}
    </div>
  );
}
