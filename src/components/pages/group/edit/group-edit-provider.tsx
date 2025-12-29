import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { ErrorPage } from "~/components/pages/error";
import { Loading } from "~/components/pages/loading";
import { MainButton } from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import { api, type RouterOutputs } from "~/utils/api";

type Group = RouterOutputs["group"]["get"];
type GroupEdit = Pick<Group, "name" | "accentColorId">;

interface Context {
  group: Group;
  edit: GroupEdit;
  onEdit: (edit: Partial<GroupEdit>) => void;
}

const Context = createContext<Context | null>(null);

export const useGroupEditCtx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useGroupCtx must be used within a GroupProvider");
  }
  return ctx;
};

interface Props {
  id: string;
  children: React.ReactNode;
}

export const GroupEditProvider = ({ id, children }: Props) => {
  const { t } = useTranslation();
  const { data, error, isLoading } = api.group.get.useQuery(id, {
    enabled: !!id,
  });
  const [edit, setEdit] = useState<GroupEdit>({ name: "", accentColorId: 0 });
  useEffect(() => {
    if (!data) return;
    setEdit({ name: data.name, accentColorId: data.accentColorId });
  }, [data]);

  const { update, isLoading: isUpdating } = useGroupEdit(id, edit);

  function isDisabled() {
    if (!data) return true;
    if (!edit.name) return true;
    if (edit.name === data.name && edit.accentColorId === data.accentColorId) {
      return true;
    }
    return false;
  }

  if (error) return <ErrorPage error={error} />;
  if (isLoading) return <Loading />;
  if (!data) return null;

  return (
    <Context.Provider
      value={{
        group: data,
        edit,
        onEdit: (edit) => setEdit((prev) => ({ ...prev, ...edit })),
      }}
    >
      {children}
      <MainButton
        onClick={update}
        label={t("save")}
        isLoading={isUpdating}
        disabled={isDisabled()}
      />
    </Context.Provider>
  );
};

function useGroupEdit(id: string, params: GroupEdit) {
  const ctx = api.useUtils();
  const router = useWebAppRouter();
  const { t } = useTranslation();

  const ref = useRef(params);
  ref.current = params;

  const { mutate, isLoading } = api.group.edit.useMutation({
    onSuccess: () => {
      ctx.group.get.setData(id, (v) => {
        if (!v) return v;
        return { ...v, ...ref.current };
      });
      void router.back();
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  const update = useCallback(() => {
    const v = ref.current;
    if (v.name.length === 0) {
      toast.error(t("error.name_required"));
      return;
    }

    mutate({ id, ...v });
  }, [id, mutate, t]);

  return { update, isLoading };
}
