import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import type {
  MainButtonProps,
  Platform,
} from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import { URLS } from "~/lib/consts/urls";

type WebAppOrNull = typeof window.Telegram.WebApp | null;

export function useTgDrawerState() {
  const [open, setOpen] = useState(false);
  // Save the state of the main button before opening the drawer
  const prevBtnIsVisible = useRef(false);

  const onOpen = () => {
    prevBtnIsVisible.current = window?.Telegram?.WebApp?.MainButton?.isVisible;
    window?.Telegram?.WebApp?.MainButton?.hide();
    window?.Telegram?.WebApp?.expand();
    setOpen(true);
  };

  const onOpenChange = (v: boolean) => {
    if (v) return;
    if (prevBtnIsVisible.current) {
      window?.Telegram?.WebApp?.MainButton?.show();
    }
    setOpen(false);
  };

  const onClose = () => {
    setOpen(false);
  };

  return { open, onOpen, onClose, onOpenChange };
}

export const useTelegram = (ready: boolean): Platform | null => {
  const [tg, setTg] = useState<Telegram["WebApp"] | null>(null);

  useTgTheme(tg);
  const { setOnBack } = useBackButton(tg);
  const { setOnMain, Button: MainButton } = useMainButton(tg);
  useSettingsButton(tg);

  useEffect(() => {
    if (!ready) return;
    if (tg) return;
    if (!window?.Telegram?.WebApp) return;
    const webApp = window.Telegram.WebApp;
    if (!webApp.initData) {
      console.warn("Telegram not initialized");
      return;
    }

    webApp.ready();
    webApp.expand();
    setTg(window.Telegram.WebApp);
  }, [ready, tg]);

  if (!tg) return null;

  const platform = tg.platform?.toLowerCase() ?? "";
  const isMobile = platform === "ios" || platform === "android";

  return {
    type: "tg",
    haptic: {
      notification: (v) => tg.HapticFeedback.notificationOccurred(v),
    },
    confirmDialog: (message) =>
      new Promise((resolve) => tg.showConfirm(message, resolve)),
    register: async (): Promise<boolean> => {
      // Request write access only from v6.9
      // Also, doesn't work on desktop
      if (parseFloat(tg.version) < 6.9 || !isMobile) {
        tg.openTelegramLink(URLS.BOT_URL_START);
        return true;
      }
      const res = await new Promise<boolean>((resolve) => {
        tg.requestWriteAccess(resolve);
      }).catch(() => {
        tg.openTelegramLink(URLS.BOT_URL_START);
        return true;
      });
      return res;
    },
    openTgLink: (link) => tg.openTelegramLink(link),
    openLink: (link) => tg.openLink(link),
    close: () => tg.close(),
    setHeaderColor: (color) => {
      tg.setHeaderColor(color);
      tg.setBackgroundColor(color);
    },
    setOnBack,
    BackButton: () => <></>,
    setOnMain,
    MainButton,
  };
};

const useMainButton = (webApp: WebAppOrNull) => {
  const callback = useRef<() => void>();

  return {
    setOnMain: (onMain?: () => void) => {
      callback.current = onMain;
    },
    Button: ({ label, disabled, loading }: MainButtonProps) => {
      useEffect(() => {
        if (!webApp) return;
        const onClick = () => callback.current?.();
        webApp.MainButton.onClick(onClick);
        if (!webApp.MainButton.isVisible) {
          webApp.MainButton.show();
        }
        return () => {
          webApp?.MainButton.offClick(onClick);
          webApp?.MainButton.hide();
        };
      }, []);

      useEffect(() => {
        if (!webApp) return;
        if (!disabled === webApp.MainButton.isActive) return;
        if (disabled) {
          webApp.MainButton.setParams({
            is_active: false,
            text: label,
            color: webApp.colorScheme === "light" ? "#e8e8e9" : "#2f2f2f",
            text_color: webApp.colorScheme === "light" ? "#b9b9ba" : "#606060",
          });
        } else {
          webApp.MainButton.setParams({
            is_active: true,
            text: label,
            color: webApp.themeParams.button_color,
            text_color: webApp.themeParams.button_text_color,
          });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [disabled, loading]);

      useEffect(() => {
        if (!webApp) return;
        if (loading === undefined) return;
        if (loading === webApp.MainButton.isProgressVisible) return;
        if (loading) {
          webApp.MainButton.disable();
          webApp.MainButton.showProgress(false);
        } else {
          webApp.MainButton.enable();
          webApp.MainButton.hideProgress();
        }
      }, [loading]);

      useEffect(() => {
        if (!webApp) return;
        if (webApp.MainButton.text === label) return;
        webApp.MainButton.setText(label);
      }, [label]);
      return null;
    },
  };
};

const useSettingsButton = (webApp: WebAppOrNull) => {
  const { push } = useWebAppRouter();
  const isSetup = useRef(false);
  useEffect(() => {
    if (!webApp) return;
    if (isSetup.current) return;

    isSetup.current = true;
    const tg = window.Telegram.WebApp;
    tg.SettingsButton.onClick(
      () => void push({ pathname: "/webapp/settings" })
    );
    tg.SettingsButton.show();
  }, [webApp, push]);
};

const useBackButton = (webApp: WebAppOrNull) => {
  const callback = useRef<() => void>();
  const router = useRouter();
  const shown = useRef(false);
  const { back } = useWebAppRouter();

  useEffect(() => {
    if (!webApp) return;

    if (router.pathname === "/webapp") {
      shown.current = false;
      webApp.BackButton.hide();
      return;
    }
    if (shown.current) return;

    shown.current = true;
    webApp.BackButton.onClick(() => {
      if (callback.current) {
        callback.current();
        return;
      }
      back();
    });
    webApp.BackButton.show();
  }, [webApp, router.pathname, back]);

  return {
    setOnBack: (onBack?: () => void) => {
      callback.current = onBack;
    },
  };
};

const useTgTheme = (webApp: WebAppOrNull) => {
  const { setTheme } = useTheme();
  const curThemeVals = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!webApp) return;

    const onThemeChange = () => {
      const theme = webApp.colorScheme === "dark" ? "dark" : "light";
      setThemeFromTelegram(curThemeVals.current);
      setTheme(theme);
    };

    webApp.onEvent("themeChanged", onThemeChange);
    onThemeChange();

    return () => {
      webApp.offEvent("themeChanged", onThemeChange);
    };
  }, [webApp, setTheme]);
};

function setThemeFromTelegram(curVals: Record<string, string>) {
  function upsert(key: string, hexVal: string, onSet?: () => void) {
    if (curVals[key] === hexVal) return;
    curVals[key] = hexVal;
    const hsl = hexToHSL(hexVal);
    document.documentElement.style.setProperty(key, hsl);
    if (onSet) onSet();
  }

  const webApp = window.Telegram.WebApp;
  const theme = webApp.themeParams;

  // check that all theme values are defined
  if (
    !theme ||
    !theme.bg_color ||
    !theme.text_color ||
    !theme.hint_color ||
    !theme.link_color ||
    !theme.button_color ||
    !theme.button_text_color ||
    !theme.secondary_bg_color
  ) {
    return false;
  }

  upsert("--canvas", theme.secondary_bg_color, () => {
    webApp.setBackgroundColor(theme.secondary_bg_color || "");
    webApp.setHeaderColor(theme.secondary_bg_color || "");
  });
  upsert("--background", theme.bg_color);
  upsert("--foreground", theme.text_color);
  upsert("--hint", theme.hint_color);
  upsert("--link", theme.link_color);
  upsert("--primary", theme.button_color);
  upsert("--primary-foreground", theme.button_text_color);

  return true;
}

function hexToHSL(H: string) {
  // Utility to convert a hex color to its decimal equivalent
  const hexToDec = (idx1: number, idx2: number) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    parseInt(H[idx1]! + H[idx2]!, 16);

  // Convert hex to RGB first
  let r = 0,
    g = 0,
    b = 0;
  if (H.length === 4) {
    r = hexToDec(1, 1);
    g = hexToDec(2, 2);
    b = hexToDec(3, 3);
  } else if (H.length === 7) {
    r = hexToDec(1, 2);
    g = hexToDec(3, 4);
    b = hexToDec(5, 6);
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;

  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;

  let h = 0,
    s = 0,
    l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}
