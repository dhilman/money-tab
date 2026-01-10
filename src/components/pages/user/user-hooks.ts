import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { usePlatform } from "~/components/provider/platform/context";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { api } from "~/utils/api";

interface SettleMutationParams {
  userId: string;
  amount: number;
  currencyCode: string;
}

export const useSettleMutation = (params: SettleMutationParams) => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const utils = api.useUtils();
  const mutation = api.tx.settle.useMutation({
    onSuccess: () => {
      utils.user.start.setData(undefined, (prev) => {
        if (!prev) return prev;
        const balances = prev.balances.filter(
          (b) =>
            b.userId !== params.userId || b.currencyCode !== params.currencyCode
        );
        return { ...prev, balances };
      });
      toast.success(t("success_settled"));
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  const settle = async () => {
    const v = formatAmountCurrency(params.amount, params.currencyCode, {
      withSign: false,
      withSymbol: true,
    });
    const res = await platform.confirmDialog(
      t("confirm.settle", { amount: v })
    );
    if (res) {
      mutation.mutate(params);
    }
  };

  return { settle, isLoading: mutation.isPending };
};
