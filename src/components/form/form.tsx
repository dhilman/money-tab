import { Separator } from "~/components/ui/list";
import { cn } from "~/lib/utils";

interface FormSectionProps {
  children: React.ReactNode;
}

export const FormSection = ({ children }: FormSectionProps) => {
  return (
    <div className="w-full px-2">
      <div className="w-full rounded-xl bg-background">{children}</div>
    </div>
  );
};

interface FormFieldProps {
  className?: string;
  children: React.ReactNode;
}

export const FormField = ({ className, children }: FormFieldProps) => {
  return (
    <div className={cn("flex h-14 w-full items-center gap-2 px-3", className)}>
      {children}
    </div>
  );
};

interface FormLabelProps {
  className?: string;
  children: React.ReactNode;
}

export const FormLabel = ({ children, className }: FormLabelProps) => {
  return (
    <div className={cn("w-24 shrink-0 text-sm font-medium", className)}>
      {children}
    </div>
  );
};

export const FormLabelWithIcon = ({ children, className }: FormLabelProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-sm font-medium",
        className
      )}
    >
      {children}
    </div>
  );
};

export const FormIcon = ({ children, className }: FormLabelProps) => {
  return (
    <div
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
        className
      )}
    >
      {children}
    </div>
  );
};

interface FormDividerProps {
  className?: string;
  full?: boolean;
}

export const FormDivider = ({ className, full }: FormDividerProps) => {
  return (
    <div className={cn("w-full", !full && "pl-28", className)}>
      <Separator />
    </div>
  );
};
