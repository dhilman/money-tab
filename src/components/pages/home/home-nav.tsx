import { EyeIcon, EyeOffIcon, SettingsIcon } from "lucide-react";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import { cn } from "~/lib/utils";

interface ProfileNavProps {
  className?: string;
}

export const ProfileNav = ({ className }: ProfileNavProps) => {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-xl items-center justify-between px-4",
        className
      )}
    >
      <VisibilityToggle />
      <MyLink
        route={{ pathname: "/webapp/settings" }}
        className={cn(
          "flex h-10 w-10 items-center justify-center place-self-end",
          "rounded-full bg-background text-foreground/80"
        )}
      >
        <SettingsIcon className="h-5 w-5" />
      </MyLink>
    </div>
  );
};

const VisibilityToggle = () => {
  const { user, updateUser } = useProfile();

  return (
    <button
      className={cn(
        "flex h-10 w-10 items-center justify-center place-self-start",
        "rounded-full bg-background text-foreground/80"
      )}
      onClick={() => updateUser({ hideBalance: !user.hideBalance })}
    >
      {user.hideBalance ? (
        <EyeOffIcon className="h-5 w-5" />
      ) : (
        <EyeIcon className="h-5 w-5" />
      )}
    </button>
  );
};
