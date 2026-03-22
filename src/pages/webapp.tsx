import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Home } from "~/components/pages/home/home-page";
import { webAppPage } from "~/components/provider/webapp-provider";
import { type NewRoute } from "~/components/router/route";
import { type ParsedUrlPath } from "~/lib/url/param-codec";
import { parseTgSearchParams } from "~/lib/url/share-url";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = parsedPathToRoute(parseTgSearchParams(params));
    if (route) {
      setIsRedirecting(true);
      window.history.replaceState({}, "", "/webapp");
      void router.push(route);
    }
  }, [router]);

  if (isRedirecting) return null;

  return <Home />;
}

function parsedPathToRoute(parsed: ParsedUrlPath | null): NewRoute | null {
  if (!parsed) return null;
  switch (parsed.type) {
    case "USER":
      return { pathname: "/webapp/user/[id]", query: { id: parsed.id } };
    case "GROUP":
      return { pathname: "/webapp/group/[id]", query: { id: parsed.id } };
    case "TX":
      return {
        pathname: "/webapp/tx/[id]",
        query: { id: parsed.id, contribId: parsed.contribId },
      };
    case "SUB":
      return {
        pathname: "/webapp/sub/[id]",
        query: { id: parsed.id, contribId: parsed.contribId },
      };
  }
}
