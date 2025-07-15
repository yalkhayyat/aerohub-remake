import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";

type ContentWheelContainerProps = {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export default function ContentWheelContainer({
  title,
  description,
  className,
  children,
}: ContentWheelContainerProps): ReactNode {
  return (
    <section className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-6xl font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-foreground/70 max-w-3xl mx-auto">{description}</p>
        )}
      </div>
      <Separator />
      <div>{children}</div>
    </section>
  );
}
