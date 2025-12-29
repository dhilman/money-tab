import { useEffect, useRef } from "react";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { env } from "~/env.mjs";
import { URLS } from "~/lib/consts/urls";

export const AuthScreen = () => {
  return (
    <WebAppMain className="flex h-full min-h-screen flex-col items-center justify-center">
      <Bento>
        <BentoContent className="flex flex-col items-center gap-7 px-6 py-12 text-center">
          <div>
            <div className="text-2xl font-bold">Welcome to MoneyTab</div>
            <div className="mt-1 text-base font-semibold text-hint">
              A simple way to track your expenses
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            <TelegramLoginButton />
            <div className="text-sm font-medium text-hint">or</div>
            <a
              className="text-sm font-medium text-foreground/90 underline underline-offset-2"
              href={URLS.BOT_WEB_APP}
            >
              Open in Telegram
            </a>
          </div>
        </BentoContent>
      </Bento>
    </WebAppMain>
  );
};

const TelegramLoginButton = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?14";
    script.async = true;
    script.setAttribute("data-telegram-login", env.NEXT_PUBLIC_BOT_USERNAME);
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-radius", "8");
    script.setAttribute(
      "data-auth-url",
      `${env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/tg`
    );
    script.setAttribute("data-request-access", "write");
    ref.current.appendChild(script);
  }, [ref]);

  return <div ref={ref} />;
};
