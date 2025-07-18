import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";

type ContentWheelContainerProps = {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
  sectionId?: string;
  link?: ReactNode;
};

export default function ContentWheelContainer({
  title,
  description,
  className,
  children,
  sectionId,
  link,
}: ContentWheelContainerProps): ReactNode {
  return (
    <section id={sectionId} className={`space-y-6 ${className}`}>
      <div className="flex flex-col text-left">
        <h2 className="text-4xl md:text-6xl font-semibold mb-2">{title}</h2>
        <div className="flex flex-row">
          {description && (
            <p className="text-foreground/70 max-w-3xl ml-1">{description}</p>
          )}
          {link}
        </div>
      </div>

      <Separator />
      <div>{children}</div>
    </section>
  );
}
