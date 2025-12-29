import { useRouter } from "next/router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Analytics,
  type EventNames,
  type EventProperties,
} from "~/components/provider/analytics/analytics-client";

const analytics = new Analytics({
  debug: process.env.NODE_ENV === "development",
});

if (typeof window !== "undefined") {
  analytics.init();
}

interface Props {
  children: React.ReactNode;
}

interface Context {
  analytics: Analytics;
}

const Context = createContext<Context | null>(null);

export const useAnalytics = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useAnalytics must be used within a AnalyticsProvider");
  }
  return ctx.analytics;
};

export function useTrackOnce(event: EventNames, properties?: EventProperties) {
  const analytics = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;

    analytics.track(event, properties);
    hasTracked.current = true;
  }, [analytics, event, properties]);
}

export const AnalyticsProvider = ({ children }: Props) => {
  const [anals] = useState(analytics);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      analytics.pageview();
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  });

  return (
    <Context.Provider value={{ analytics: anals }}>{children}</Context.Provider>
  );
};
