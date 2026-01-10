import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { userCols } from "~/components/admin/admin-table/admin-user-cols";
import { DataTable } from "~/components/admin/admin-table/data-table";
import { Bento } from "~/components/bento-box";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { env } from "~/env.mjs";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const { data } = api.admin.users.useQuery(pagination, {
    placeholderData: keepPreviousData,
  });

  if (!data) return null;

  return (
    <>
      <NavDefault title="Users" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-4 py-6">
        {env.NEXT_PUBLIC_ENV !== "prod" && (
          <div className="mx-auto w-full max-w-md">
            <CreateUser />
          </div>
        )}
        <div className="flex w-full items-center justify-start px-4">
          <div className="text-2xl font-semibold">Users</div>
        </div>

        <DataTable
          data={data.users}
          columns={userCols}
          rowCount={data.total}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </WebAppMain>
    </>
  );
}

const CreateUser = () => {
  const ctx = api.useUtils();
  const mutate = api.admin.createUser.useMutation({
    onSuccess: () => {
      void ctx.admin.users.invalidate();
      toast.success("User created");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  return (
    <Bento>
      <Accordion type="multiple" className="w-full rounded-xl bg-background">
        <AccordionItem value="create" className="border-b-0">
          <AccordionTrigger className="px-4">Create User</AccordionTrigger>
          <AccordionContent className="flex w-full flex-col gap-2 px-3">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input
                value={firstName}
                className="border border-hint/30"
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input
                value={lastName}
                className="border border-hint/30"
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Username</Label>
              <Input
                value={username}
                className="border border-hint/30"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mt-2 flex w-full items-center justify-between">
              <Label>Registered</Label>
              <Switch
                checked={isRegistered}
                onCheckedChange={setIsRegistered}
              />
            </div>
            <Button
              onClick={() => {
                mutate.mutate({ firstName, lastName, username, isRegistered });
              }}
            >
              Create User
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Bento>
  );
};
