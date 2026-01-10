import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { FormField } from "~/components/form/form";
import { TextInput } from "~/components/form/text-input";
import { ErrorPage } from "~/components/pages/error";
import { Loading } from "~/components/pages/loading";
import { UserAvatar } from "~/components/pages/user/user-avatar";
import { formatUserName } from "~/components/pages/user/user-name";
import {
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import { Button } from "~/components/ui/button";
import i18n from "~/lib/i18n";
import { api, type RouterOutputs } from "~/utils/api";

type User = RouterOutputs["user"]["get"];

interface Props {
  id: string;
}

export const UserEditPage = ({ id }: Props) => {
  const { data, error } = api.user.get.useQuery(id);

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!data) return <Loading />;

  return <UserEditMain user={data} />;
};

interface UserEditMainProps {
  user: User;
}

const UserEditMain = ({ user }: UserEditMainProps) => {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  const updateName = useUpdateName();
  const [startName] = useState(formatUserName(user));
  const [name, setName] = useState(startName);
  const isEdited = name !== startName;

  return (
    <WebAppMain>
      <div className="flex w-full justify-center">
        <UserAvatar user={user} size="4xl" />
      </div>
      <Bento className="mt-4">
        <BentoHeader>{t("user_name")}</BentoHeader>
        <BentoContent>
          <FormField className="h-12 px-4">
            <TextInput
              placeholder={name}
              value={name}
              onChange={(v) => setName(v)}
            />
          </FormField>
        </BentoContent>
      </Bento>
      <div className="h-12" />
      <RemoveContactButton id={user.id} />
      <MainButton
        onClick={async () => {
          if (isEdited) {
            await updateName.mutateAsync({ id: user.id, nickname: name });
          }
          router.back();
        }}
        isLoading={updateName.isPending}
        disabled={!isEdited}
        label={t("save")}
      />
    </WebAppMain>
  );
};

const RemoveContactButton = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const ctx = api.useUtils();
  const router = useWebAppRouter();
  const platform = usePlatform();
  const { mutate, isPending: isLoading } = api.user.disconnect.useMutation({
    onSuccess: (data) => {
      ctx.user.start.setData(undefined, (prev) => {
        if (!prev) return prev;
        const connections = prev.connections.filter((c) => c.id !== data.id);
        return { ...prev, connections };
      });
      void router.replace({ pathname: "/webapp" });
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  return (
    <Bento>
      <Button
        variant="default"
        size="md"
        className="justify-start text-left text-red-500"
        onClick={async () => {
          const res = await platform.confirmDialog(t("confirm.delete_contact"));
          if (!res) return;
          mutate(id);
        }}
        disabled={isLoading}
      >
        {t("delete_contact")}
      </Button>
      <div className="w-full px-2 pt-1 text-left text-sm text-hint">
        {t("delete_contact_note")}
      </div>
    </Bento>
  );
};

const useUpdateName = () => {
  const ctx = api.useUtils();
  return api.user.updateNickname.useMutation({
    onSuccess: (data) => {
      ctx.user.start.setData(undefined, (prev) => {
        if (!prev) return prev;
        const connections = prev.connections.map((c) => {
          if (c.id !== data.id) return c;
          return { ...c, nickname: data.nickname };
        });
        return { ...prev, connections };
      });
      ctx.user.get.setData(data.id, (prev) => {
        if (!prev) return prev;
        return { ...prev, nickname: data.nickname };
      });
    },
    onError: () => {
      toast.error(i18n.t("error.generic"));
    },
  });
};
