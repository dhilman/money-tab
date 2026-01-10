import { Loader2Icon } from "lucide-react";
import { BackButton } from "~/components/provider/platform/context";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export const Nav = ({ className, children }: Props) => {
  return (
    <div className="w-full">
      <nav
        className={cn(
          "mx-auto grid h-[52px] w-full max-w-xl grid-cols-3 items-center px-4",
          className,
        )}
      >
        {children}
      </nav>
    </div>
  );
};

interface NavDefaultProps {
  title: React.ReactNode;
  button?: React.ReactNode;
}

export const NavDefault = ({ title, button }: NavDefaultProps) => {
  return (
    <Nav>
      <BackButton />
      <NavTitle>{title}</NavTitle>
      {button && (
        <div className="flex w-full items-center justify-end">{button}</div>
      )}
    </Nav>
  );
};

export const NavWithBack = ({ children }: { children: React.ReactNode }) => {
  return (
    <Nav>
      <BackButton />
      {children}
    </Nav>
  );
};

interface NavTitleProps {
  children: React.ReactNode;
}

export const NavTitle = ({ children }: NavTitleProps) => {
  return (
    <div className="col-start-2 place-self-center text-base font-semibold whitespace-nowrap">
      {children}
    </div>
  );
};

interface NavButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const NavButtonRight = (props: NavButtonProps) => {
  return (
    <div className="flex w-full items-center justify-end">
      <NavButton {...props} />
    </div>
  );
};

export const NavButton = ({
  children,
  onClick,
  disabled,
  isLoading,
}: NavButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="md"
      className="w-fit px-2 font-semibold"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2Icon className="h-5 w-5 animate-spin duration-1000" />
      ) : (
        children
      )}
    </Button>
  );
};
