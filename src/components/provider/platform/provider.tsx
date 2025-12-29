import Script from "next/script";
import { useState } from "react";
import { PlatformContext } from "~/components/provider/platform/context";
import { useTelegram } from "~/components/provider/platform/tg";
import { useWebPlatform } from "~/components/provider/platform/web";

interface Props {
  children: React.ReactNode;
}

export const PlatformProvider = ({ children }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const tg = useTelegram(loaded);
  const web = useWebPlatform();

  return (
    <PlatformContext.Provider value={tg || web}>
      <Script src="/api/telegram-web-app.js" onLoad={() => setLoaded(true)} />
      {children}
    </PlatformContext.Provider>
  );
};
