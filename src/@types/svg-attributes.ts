import "react";

// Overwrite the SVGProps interface to have radius accept array of numbers
// Needed for recharts Cell component
declare module "react" {
  interface SVGProps<T> extends SVGAttributes<T> {
    radius?: string | number | number[] | undefined;
  }
}
