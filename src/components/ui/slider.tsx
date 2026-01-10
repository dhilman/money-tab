import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "~/lib/utils";

const SliderThumb = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb>
>((props, ref) => (
  <SliderPrimitive.Thumb
    ref={ref}
    className="focus-visible:ring-ring block h-5 w-5 rounded-full border border-hint/20 bg-background shadow-sm ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
    {...props}
  />
));

SliderThumb.displayName = "SliderThumb";

const SliderTrack = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Track>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Track>
>((props, ref) => (
  <SliderPrimitive.Track
    ref={ref}
    className="relative h-2 w-full grow overflow-hidden rounded-full bg-canvas"
    {...props}
  >
    <SliderPrimitive.Range className="absolute h-full bg-primary/80" />
  </SliderPrimitive.Track>
));

SliderTrack.displayName = "SliderTrack";

const SliderRoot = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none items-center select-none",
      className,
    )}
    {...props}
  />
));

SliderRoot.displayName = "SliderRoot";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderRoot ref={ref} className={className} {...props}>
    <SliderTrack />
    <SliderThumb />
  </SliderRoot>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider, SliderRoot, SliderTrack, SliderThumb };
