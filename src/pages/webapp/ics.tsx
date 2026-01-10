import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { ClientComponent } from "~/components/common/client-component";
import { Nav, NavTitle } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { useTypedQuery } from "~/components/router/router";
import { Button } from "~/components/ui/button";
import { URLS } from "~/lib/consts/urls";
import { createIcsDataUrl, formatEventDate } from "~/lib/dates/ics";

export default function Page() {
  const { t } = useTranslation();
  const query = useTypedQuery("/webapp/ics");
  return (
    <ClientComponent>
      <Nav>
        <NavTitle>{t("event")}</NavTitle>
      </Nav>

      <WebAppMain className="flex h-full min-h-full w-full max-w-sm items-center justify-center">
        <Bento>
          <BentoContent className="flex w-full flex-col items-center p-6">
            <div className="mb-4 w-full space-y-2 text-center">
              <div className="text-xl font-bold">
                {query.title || t("no_desc")}
              </div>
              <div className="text-hint text-base font-medium capitalize">
                {formatEventDate(query.start)}
              </div>
            </div>
            <IcsButton title={query.title || ""} start={query.start} />
            <Button size="sm" variant="default" className="mt-3" asChild>
              <a href={URLS.BOT_URL} target="_blank">
                {t("back_to_app")}
              </a>
            </Button>
          </BentoContent>
        </Bento>
      </WebAppMain>
    </ClientComponent>
  );
}

interface IcsButtonProps {
  title: string;
  start: string;
}

function IcsButton({ title, start }: IcsButtonProps) {
  const file = useMemo(() => {
    const end = dayjs(start).add(1, "hour").toISOString();
    return createIcsDataUrl({ title, start, end });
  }, [start, title]);

  return (
    <Button
      size="lg"
      variant="accent"
      asChild
      className="h-11 w-fit rounded-lg px-8 font-semibold"
    >
      <a href={file} download="event.ics">
        <CalendarIcon className="mr-1.5 h-6 w-6" />
        Add to calendar
      </a>
    </Button>
  );
}
