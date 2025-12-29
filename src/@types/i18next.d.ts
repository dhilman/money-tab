import type Resources from "~/@types/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: Resources;
  }
}

export type MyResourceKey = keyof Resources["common"];
