import { ChevronLeftIcon } from "lucide-react";
import React, { useRef } from "react";
import type {
  MainButtonProps,
  Platform,
} from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import { Button } from "~/components/ui/button";

function noop() {
  return;
}

function useMainButton() {
  const callback = useRef<() => void>(undefined);

  return {
    setOnMain: (onMain?: () => void) => {
      callback.current = onMain;
    },
    Button: ({ label, disabled, loading }: MainButtonProps) => {
      return (
        <div
          className="fixed bottom-0 left-0 h-fit w-full px-2"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
            paddingTop: "calc(env(safe-area-inset-top) + 8px)",
          }}
        >
          <Button
            onClick={() => {
              if (callback.current) {
                callback.current();
              }
            }}
            variant="accent"
            size="lg"
            disabled={disabled || loading}
            className="mx-auto max-w-xl rounded-lg text-base font-semibold"
          >
            {label}
          </Button>
        </div>
      );
    },
  };
}

function useBackButton() {
  const router = useWebAppRouter();
  const onBack = React.useRef<() => void>(undefined);

  function back() {
    if (onBack.current) {
      console.log("onBack called");
      onBack.current();
    } else {
      console.log("router.back called");
      router.back();
    }
  }

  return {
    setOnBack: (onBackCb?: () => void) => {
      onBack.current = onBackCb;
    },
    Button: () => (
      <Button size="icon" variant="ghost" onClick={back} className="border-0">
        <ChevronLeftIcon className="h-5 w-5" />
      </Button>
    ),
  };
}

export function useWebPlatform(): Platform {
  const { setOnBack, Button } = useBackButton();
  const { setOnMain, Button: MemoMainButton } = useMainButton();

  return {
    type: "web",
    haptic: {
      notification: noop,
    },
    confirmDialog: async (message) => {
      return Promise.resolve(window.confirm(message));
    },
    register: () => {
      return Promise.resolve(true);
    },
    close: noop,
    openTgLink: (link) => window.open(link),
    openLink: (link) => window.open(link, "_blank"),
    setHeaderColor: noop,
    setOnBack,
    BackButton: Button,
    setOnMain,
    MainButton: MemoMainButton,
  };
}
