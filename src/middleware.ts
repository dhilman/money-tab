import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.mjs";
import { parseTgSearchParams } from "~/lib/url/share-url";

export function middleware(req: NextRequest) {
  const data = parseTgSearchParams(req.nextUrl.searchParams);
  if (!data) return NextResponse.next();

  switch (data.type) {
    case "USER":
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_BASE_URL}/webapp/user/${data.id}`,
      );
    case "GROUP":
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_BASE_URL}/webapp/group/${data.id}`,
      );
    case "TX": {
      let url = `${env.NEXT_PUBLIC_BASE_URL}/webapp/tx/${data.id}`;
      if (data.contribId) {
        url += `?contribId=${data.contribId}`;
      }
      return NextResponse.redirect(url);
    }
    case "SUB": {
      let url = `${env.NEXT_PUBLIC_BASE_URL}/webapp/sub/${data.id}`;
      if (data.contribId) {
        url += `?contribId=${data.contribId}`;
      }
      return NextResponse.redirect(url);
    }
  }
}

export const config = {
  matcher: [
    {
      source: "/webapp",
      has: [
        {
          type: "query",
          key: "tgWebAppStartParam",
        },
      ],
    },
  ],
};
