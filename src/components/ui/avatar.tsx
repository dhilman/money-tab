import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";
import { cn } from "~/lib/utils";

export const avatarVariants = cva(
  "shrink-0 rounded-full flex overflow-hidden uppercase items-center justify-center font-semibold",
  {
    variants: {
      size: {
        xs: "h-5 w-5 text-[8px]",
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-9 w-9 text-sm font-bold",
        xl: "h-10 w-10 text-base font-bold",
        "2xl": "h-12 w-12 text-lg font-extrabold",
        "3xl": "h-16 w-16 text-3xl font-bold",
        "4xl": "h-20 w-20 text-4xl font-bold",
        "5xl": "h-24 w-24 text-5xl font-bold",
        "6xl": "h-28 w-28 text-5xl font-bold font-rounded",
      },
    },
  },
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  className?: string;
  src: string | null;
  initials: string;
  colorId: number;
}

export function Avatar({
  className,
  src,
  initials,
  colorId,
  size,
}: AvatarProps) {
  return (
    <div className={cn(avatarVariants({ size }), className)}>
      <AvatarImage
        src={src}
        fallback={<Initials initials={initials} colorId={colorId} />}
      />
    </div>
  );
}

interface AvatarImageProps {
  src: string | null;
  fallback: React.ReactNode;
}

function AvatarImage({ src, fallback }: AvatarImageProps) {
  const [isLoadedError, setIsLoadedError] = useState(false);

  if (!src || isLoadedError) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt="Avatar"
      onError={() => setIsLoadedError(true)}
      onLoad={() => setIsLoadedError(false)}
      className="bg-canvas/50 aspect-square h-full w-full"
    />
  );
}

interface InitialsProps {
  initials: string;
  colorId: number;
}

function Initials({ initials, colorId }: InitialsProps) {
  const color = getAccentColor(colorId);

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full text-white"
      style={{
        backgroundImage: `linear-gradient(#fff -125%, ${color})`,
      }}
    >
      {initials}
    </div>
  );
}

// https://core.telegram.org/bots/api#accent-colors
export function getAccentColor(colorId: number | null) {
  colorId = colorId ? colorId % 7 : 0;
  switch (colorId) {
    case 0:
      return "#e17076";
    case 1:
      return "#faa774";
    case 2:
      return "#a695e7";
    case 3:
      return "#7bc862";
    case 4:
      return "#6ec9cb";
    case 5:
      return "#65aadd";
    case 6:
      return "#ee7aae";
    default:
      return "#e17076";
  }
}
