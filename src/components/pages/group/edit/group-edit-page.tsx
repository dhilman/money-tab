import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { FormField } from "~/components/form/form";
import { TextInput } from "~/components/form/text-input";
import { useGroupEditCtx } from "~/components/pages/group/edit/group-edit-provider";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { usePlatform } from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export const GroupEditPage = () => {
  const { group } = useGroupEditCtx();

  return (
    <WebAppMain className="py-8">
      <div className="flex w-full justify-center">
        <GroupAvatar group={group} size="4xl" />
      </div>
      <div className="h-4" />
      <EditName />
      <div className="h-12" />
      <ArchiveButton />
    </WebAppMain>
  );
};

const EditName = () => {
  const { t } = useTranslation();
  const { edit, onEdit } = useGroupEditCtx();

  return (
    <Bento>
      <BentoHeader>{t("name")}</BentoHeader>
      <BentoContent>
        <FormField className="h-12 px-4">
          <TextInput
            placeholder={edit.name}
            value={edit.name}
            onChange={(v) => onEdit({ name: v })}
          />
        </FormField>
      </BentoContent>
    </Bento>
  );
};

const ArchiveButton = () => {
  const { t } = useTranslation();
  const ctx = api.useUtils();
  const router = useWebAppRouter();
  const platform = usePlatform();
  const { group } = useGroupEditCtx();
  const { mutate, isPending: isLoading } = api.group.archive.useMutation({
    onSuccess: (data) => {
      ctx.user.start.setData(undefined, (prev) => {
        if (!prev) return prev;
        const groups = prev.groups.filter((c) => c.id !== data.id);
        return { ...prev, groups };
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
          const res = await platform.confirmDialog(t("confirm.archive_group"));
          if (!res) return;
          mutate(group.id);
        }}
        disabled={isLoading}
      >
        {t("archive_group")}
      </Button>
      <div className="text-hint w-full px-2 pt-1 text-left text-sm">
        {t("archive_group_note")}
      </div>
    </Bento>
  );
};
