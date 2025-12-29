import { useProfile } from "~/components/provider/auth/auth-provider";

export const MustAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useProfile();

  if (isLoading) return null;
  if (!user) return null;

  return <>{children}</>;
};
