import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  useAnalytics,
  useTrackOnce,
} from "~/components/provider/analytics/analytics-provider";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";

export const TourLocalStorage = {
  get isDismissed() {
    return localStorage.getItem("tour-dismissed") === "true";
  },
  setDismissed(value: boolean) {
    localStorage.setItem("tour-dismissed", value ? "true" : "false");
  },
  get isDismissable() {
    return localStorage.getItem("tour-dismissable") === "true";
  },
  setDismissable(value: boolean) {
    localStorage.setItem("tour-dismissable", value ? "true" : "false");
  },
};

interface Context {
  page: number;
  onPrev: () => void;
  onNext: () => void;
}

const Context = createContext<Context | null>(null);

export const useTourCtx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useIntroCtx must be used within a IntroProvider");
  }
  return ctx;
};

interface Props {
  children: React.ReactNode;
  numPages: number;
}

export const TourProvider = ({ children, numPages }: Props) => {
  const { t } = useTranslation();
  const { setOnMain, MainButton } = usePlatform();
  const router = useWebAppRouter();
  const analytics = useAnalytics();
  const { register } = useProfile();
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  pageRef.current = page;

  useTrackOnce("tour_started");

  const onCompleted = useCallback(() => {
    analytics.track("tour_completed");
    TourLocalStorage.setDismissed(true);
    void register().then(() => {
      void router.back();
    });
  }, [register, analytics, router]);

  const onNext = useCallback(() => {
    if (pageRef.current < numPages - 1) {
      setPage(pageRef.current + 1);
    } else {
      onCompleted();
    }
  }, [numPages, onCompleted]);

  const onPrev = () => {
    if (pageRef.current > 0) {
      setPage(pageRef.current - 1);
    }
  };

  useEffect(() => TourLocalStorage.setDismissable(true));
  useEffect(() => {
    setOnMain(onNext);
  }, [setOnMain, onNext]);

  return (
    <Context.Provider
      value={{
        page,
        onPrev,
        onNext,
      }}
    >
      {children}
      <MainButton label={page < numPages - 1 ? t("next") : t("get_started")} />
    </Context.Provider>
  );
};
