import React from "react";
import { cn } from "~/lib/utils";

interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

export const AnimatedImageContainer = ({
  className,
  children,
}: ContainerProps) => {
  return (
    <div
      className={cn(
        "flex h-[92px] w-[92px] items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
};

const Images = {
  tv: "/animation/tv.webp",
  abacus: "/animation/abacus.webp",
  bust: "/animation/bust.webp",
  busts: "/animation/busts.webp",
  cart: "/animation/cart.webp",
  fork_and_knife: "/animation/fork-and-knife.webp",
  plane: "/animation/plane.webp",
  ticket: "/animation/ticket.webp",
};

export type AnimatedImage = keyof typeof Images;

interface AnimatedImageProps {
  className?: string;
  name: AnimatedImage;
}

export const AnimatedImage = ({ className, name }: AnimatedImageProps) => {
  return (
    <img src={Images[name]} className={cn("h-20 w-20", className)} alt={name} />
  );
};
