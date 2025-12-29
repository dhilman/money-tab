import type { EventName } from "~/lib/consts/constants";

export type NewRoute =
  | {
      pathname: "/webapp";
    }
  | {
      pathname: "/webapp/tour";
    }
  | {
      pathname: "/webapp/news";
    }
  | {
      pathname: "/webapp/news/[name]";
      query: { name: string };
    }
  | {
      pathname: "/webapp/user/[id]";
      query: { id: string };
    }
  | {
      pathname: "/webapp/user/[id]/edit";
      query: { id: string };
    }
  | {
      pathname: "/webapp/contacts";
      query: { tab?: "contacts" | "groups" };
    }
  | {
      pathname: "/webapp/contacts/add";
    }
  | {
      pathname: "/webapp/tx/[id]";
      query: { id: string; contribId?: string };
    }
  | {
      pathname: "/webapp/tx/[id]/edit";
      query: { id: string };
    }
  | {
      pathname: "/webapp/tx/create";
      query?: { userId?: string; groupId?: string };
    }
  | {
      pathname: "/webapp/txs";
      query?: { userId?: string; groupId?: string };
    }
  | {
      pathname: "/webapp/sub/[id]";
      query: { id: string; contribId?: string; tab?: "details" | "contribs" };
    }
  | {
      pathname: "/webapp/sub/create";
      query?: { userId?: string; groupId?: string };
    }
  | {
      pathname: "/webapp/sub/[id]/edit";
      query: { id: string };
    }
  | {
      pathname: "/webapp/subs";
    }
  | {
      pathname: "/webapp/group/[id]";
      query: { id: string };
    }
  | {
      pathname: "/webapp/group/[id]/edit";
      query: { id: string };
    }
  | {
      pathname: "/webapp/group/create";
    }
  | {
      pathname: "/webapp/ics";
      query: {
        title?: string;
        start: string;
      };
    }
  | {
      pathname: "/webapp/settings";
    }
  | {
      pathname: "/webapp/settings/language";
    }
  | {
      pathname: "/webapp/settings/currency";
      query?: { force: "true" };
    }
  | {
      pathname: "/admin/main-events";
      query: { event: EventName };
    }
  | {
      pathname: "/admin/dashboard";
    }
  | {
      pathname: "/admin/issues";
    }
  | {
      pathname: "/admin/issue/[hash]";
      query: { hash: string };
    }
  | {
      pathname: "/admin/sessions";
    }
  | {
      pathname: "/admin/page-views";
    }
  | {
      pathname: "/admin/user-stats";
    }
  | {
      pathname: "/admin/notifs";
    }
  | {
      pathname: "/admin/users";
    }
  | {
      pathname: "/admin/user/[id]";
      query: { id: string };
    };
