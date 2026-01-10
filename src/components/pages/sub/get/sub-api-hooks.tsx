import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { useAddUsersToIndex } from "~/components/provider/users-provider";
import type { ReminderValue } from "~/lib/consts/types";
import { api, type RouterOutputs } from "~/utils/api";

export type SubGetApi = RouterOutputs["sub"]["get"];
export type SubInvalidate = (fn?: (input: SubGetApi) => SubGetApi) => void;

interface Params {
  id: string;
  contribId?: string;
}

export function useSubGet(params: Params) {
  const { t } = useTranslation();
  const { user: me, register } = useProfile();
  const ctx = api.useUtils();
  const placeholder = usePlaceholderData(params.id);

  const { isLoading } = useProfile();
  const { data, error, isPlaceholderData } = api.sub.get.useQuery(params, {
    enabled: !!params.id,
    placeholderData: placeholder,
  });
  useAddUsersToIndex(data ? data.contribs.map((v) => v.user) : []);

  const setData = useCallback(
    (fn: (input: SubGetApi) => SubGetApi) => {
      ctx.sub.get.setData(params, (v) => (v ? fn(v) : v));
    },
    [ctx.sub.get, params],
  );

  const invalidate = useCallback(
    (fn?: (input: SubGetApi) => SubGetApi) => {
      if (fn) setData(fn);
      void ctx.sub.get.invalidate(params);
      void ctx.user.start.invalidate();
    },
    [ctx.sub.get, ctx.user.start, params, setData],
  );

  const joinMutation = useMutation({
    mutationFn: async (contribId: string) => {
      const id = data?.id;
      if (!id) return;

      await register();

      await ctx.client.sub.join.mutate({ id: id, contribId });

      invalidate((v) => ({
        ...v,
        contribs: v.contribs.map((c) => {
          if (!c.id.startsWith(contribId)) return c;
          return { ...c, userId: me.id };
        }),
      }));

      toast.success(t("confirmed"));
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async (reminder: ReminderValue | null) => {
      const id = data?.id;
      if (!id) return;

      setData((v) => ({
        ...v,
        contribs: v.contribs.map((c) => {
          if (c.userId !== me.id) return c;
          return { ...c, reminder };
        }),
      }));

      await ctx.client.sub.updateReminder.mutate({ id, reminder });

      invalidate();
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  return {
    sub: data,
    isLoading: !data?.id && (isPlaceholderData || isLoading),
    error,
    invalidate,
    joinMutation,
    updateReminderMutation,
  };
}

const PLACEHODLER: SubGetApi = {
  id: "",
  renewalDate: undefined,
  joinable: false,
  name: "",
  createdAt: "",
  currencyCode: "",
  createdById: "",
  archivedById: null,
  archivedAt: null,
  groupId: null,
  amount: 0,
  visibility: "PUBLIC",
  startDate: "",
  endDate: null,
  cycleUnit: "DAY",
  cycleValue: 0,
  cycle: { unit: "DAY", value: 0 },
  trialUnit: null,
  trialValue: null,
  contribs: [],
};

const usePlaceholderData = (id: string): SubGetApi => {
  const ctx = api.useUtils();
  const start = ctx.user.start.getData();
  const sub = start?.subscriptions.find((v) => v.id === id);
  return {
    ...PLACEHODLER,
    ...sub,
    contribs: sub?.contribs.map((v) => ({ ...v, user: null })) ?? [],
  };
};
