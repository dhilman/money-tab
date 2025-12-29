import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { useAddUsersToIndex } from "~/components/provider/users-provider";
import { api, type RouterOutputs } from "~/utils/api";

export type TxApi = RouterOutputs["tx"]["get"];

interface Params {
  id: string;
  contribId?: string;
}

export function useTxApi(params: Params) {
  const { t } = useTranslation();
  const ctx = api.useUtils();
  const platform = usePlatform();

  const placeholder = usePlacehoderData(params.id);
  const {
    user: me,
    isLoading,
    invalidate: invalidateUser,
    register,
  } = useProfile();
  const { data, isPlaceholderData, error } = api.tx.get.useQuery(params, {
    enabled: !!params.id,
    placeholderData: placeholder,
  });
  useAddUsersToIndex(data?.contribs.map((c) => c.user));

  const invalidate = useCallback(
    (fn?: (input: TxApi) => TxApi) => {
      if (fn) {
        ctx.tx.get.setData(params, (v) => (v ? fn(v) : v));
      }
      void ctx.tx.get.invalidate(params);
      void ctx.user.start.invalidate();
    },
    [ctx.tx.get, ctx.user.start, params]
  );

  const txId = data?.id || "";

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await platform.confirmDialog(t("confirm.archive_tx"));
      if (!res) return;

      await ctx.client.tx.archive.mutate(txId);

      invalidate((v) => ({
        ...v,
        archivedById: me.id,
        archivedAt: new Date().toISOString(),
      }));

      toast.success(t("archived"));
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await platform.confirmDialog(t("confirm.leave_tx"));
      if (!res) return;

      await ctx.client.tx.leave.mutate(txId);

      invalidateUser((v) => ({
        ...v,
        transactions: v.transactions.filter((t) => t.id !== txId),
      }));

      toast.success(t("left"));
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (contribId: string) => {
      await register();

      await ctx.client.tx.join.mutate({ id: txId, contribId });
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

  return {
    tx: data,
    isLoading: isPlaceholderData || isLoading,
    error,
    invalidate,
    archiveMutation,
    leaveMutation,
    joinMutation,
  };
}

const PLACEHODLER: TxApi = {
  id: "",
  joinable: false,
  isCreator: false,
  isParticipant: false,
  status: "NOT_DELIVERED",
  net: 0,
  date: null,
  createdAt: "",
  currencyCode: "",
  description: null,
  createdById: "",
  archivedById: null,
  archivedAt: null,
  groupId: null,
  amount: 0,
  type: "PAYMENT",
  visibility: "PUBLIC",
  contribs: [],
  files: [],
  events: [],
};

const usePlacehoderData = (id: string) => {
  const ctx = api.useUtils();
  const start = ctx.user.start.getData();
  return {
    ...PLACEHODLER,
    ...start?.transactions.find((v) => v.id === id),
    contribs: [],
  };
};
