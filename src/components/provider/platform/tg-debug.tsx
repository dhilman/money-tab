import { useEffect, useState } from "react";
import { Bento, BentoContent } from "~/components/bento-box";

export const TgThemeParams = () => {
  const [params, setParams] = useState("");
  useEffect(() => {
    if (typeof window?.Telegram === "undefined") return;
    setTimeout(() => {
      const params = window.Telegram.WebApp.themeParams;
      const str = JSON.stringify(params, null, 2);
      setParams(str);
    }, 2000);
  }, []);

  return (
    <Bento>
      <BentoContent className="overflow-x-auto p-2 font-mono text-sm whitespace-pre">
        {params}
      </BentoContent>
    </Bento>
  );
};
