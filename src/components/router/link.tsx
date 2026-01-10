import { default as NextLink } from "next/link";
import React from "react";
import { type NewRoute } from "~/components/router/route";
import { cn } from "~/lib/utils";

interface Props {
  route: NewRoute;
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const MyLink = React.forwardRef<HTMLAnchorElement, Props>(
  ({ route, className, asChild, onClick, children }, ref) => {
    return (
      <NextLink
        href={route}
        className={className ? cn(className) : undefined}
        passHref={asChild}
        ref={ref}
        onClick={onClick}
      >
        {children}
      </NextLink>
    );
  },
);

MyLink.displayName = "MyLink";
