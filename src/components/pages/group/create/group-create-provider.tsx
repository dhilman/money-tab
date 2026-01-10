import { useMutation } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useProfile } from "~/components/provider/auth/auth-provider";
import {
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import { userStore } from "~/components/provider/users-provider";
import { useWebAppRouter } from "~/components/router/router";
import { api } from "~/utils/api";

interface ContextType {
  name: string;
  setName: (v: string) => void;
  colorId: number;
  setColorId: (v: number) => void;
  userIds: string[];
  toggleUserId: (id: string) => void;
}

const Context = createContext<ContextType | null>(null);

export const useGroupCreateCtx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      "useGroupCreateCtx must be used within a GroupCreateProvider"
    );
  }
  return ctx;
};

export const GroupCreateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [colorId, setColorId] = useState(0);
  const [name, setName] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);

  const toggleUserId = (id: string) => {
    setUserIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    );
  };

  return (
    <Context.Provider
      value={{
        name,
        setName,
        colorId,
        setColorId,
        userIds,
        toggleUserId,
      }}
    >
      {children}
      <GroupMainButton />
    </Context.Provider>
  );
};

function GroupMainButton() {
  const { t } = useTranslation();
  const { create, isLoading } = useCreateMutation();

  return (
    <MainButton onClick={create} isLoading={isLoading} label={t("create")} />
  );
}

const useCreateMutation = () => {
  const { t } = useTranslation();
  const { register } = useProfile();
  const router = useWebAppRouter();
  const platform = usePlatform();
  const ctx = api.useUtils();
  const state = useGroupCreateCtx();

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      if (!state.name) {
        toast.error(t("error.name_required"));
        throw new Error("Invalid data");
      }

      await register();
      return await ctx.client.group.create.mutate({
        name: state.name,
        colorId: state.colorId,
        members: state.userIds,
      });
    },
    onSuccess: (data) => {
      userStore.getState().setGroup(data);
      void router.replace({
        pathname: "/webapp/group/[id]",
        query: { id: data.id },
      });
    },
    onError: (err) => {
      platform.haptic.notification("error");
      if (err instanceof Error && err.message === "Invalid data") return;
      toast.error(t("error.generic"));
    },
  });

  return { create: mutate, isLoading };
};
