import { useRouter } from "next/router";
import { createContext, useCallback, useContext, useRef } from "react";
import { type NewRoute } from "~/components/router/route";

export type PathnameQueryMap = {
  [K in NewRoute as K["pathname"]]: K extends { query?: unknown }
    ? K["query"]
    : undefined;
};

export function useTypedQuery<T extends NewRoute["pathname"]>(
  _: T
): PathnameQueryMap[T] {
  const router = useRouter();
  return router.query as PathnameQueryMap[T];
}

interface Props {
  children: React.ReactNode;
}

interface RouterContext {
  push: (route: NewRoute) => Promise<boolean>;
  replace: (route: NewRoute) => Promise<boolean>;
  back: () => void;
}

const RouterContext = createContext<RouterContext | null>(null);

export const useWebAppRouter = () => {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("useWebAppRouter must be used within a RouterProvider");
  }
  return ctx;
};

function getCurrentPath() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.pathname;
}

export const RouterProvider = ({ children }: Props) => {
  const router = useRouter();
  const entryPath = useRef(getCurrentPath());

  const rawBack = router.back;
  const rawPush = router.push;
  const rawReplace = router.replace;

  const push = useCallback(rawPush, [rawPush]);
  const replace = useCallback(rawReplace, [rawReplace]);
  const back = useCallback(() => {
    if (window.location.pathname === entryPath.current) {
      void rawPush("/webapp");
    } else {
      rawBack();
    }
  }, [rawPush, rawBack]);

  return (
    <RouterContext.Provider value={{ back, push, replace }}>
      {children}
    </RouterContext.Provider>
  );
};
