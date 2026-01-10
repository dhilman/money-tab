import { cn } from "~/lib/utils";

interface LoadingProps {
  isLoading: boolean;
  loading: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingProvider = ({
  isLoading,
  loading,
  children,
}: LoadingProps) => {
  if (isLoading) return <>{loading}</>;
  return <>{children}</>;
};

interface LoadingTextProps {
  text: string;
  className?: string;
}

export const LoadingText = ({ text, className }: LoadingTextProps) => {
  return (
    <span
      className={cn(
        "bg-hint/10 w-fit animate-pulse rounded-lg text-transparent",
        className,
      )}
    >
      {text}
    </span>
  );
};

interface EmptyProps {
  isEmpty: boolean;
  empty: React.ReactNode;
  children: React.ReactNode;
}

export const EmptyProvider = ({ isEmpty, empty, children }: EmptyProps) => {
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
};

interface LoadingEmptyProps {
  isLoading: boolean;
  loading: React.ReactNode;
  isEmpty: boolean;
  empty: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingEmptyProvider = ({
  isLoading,
  loading,
  isEmpty,
  empty,
  children,
}: LoadingEmptyProps) => {
  if (isLoading) return <>{loading}</>;
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
};
