import { groupArchiveHandler } from "~/server/api/handlers/group/group-archive";
import { groupCreateHandler } from "~/server/api/handlers/group/group-create";
import { groupEditHandler } from "~/server/api/handlers/group/group-edit";
import { groupGetHandler } from "~/server/api/handlers/group/group-get";
import { groupJoinHandler } from "~/server/api/handlers/group/group-join";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { queries } from "~/server/db";
import { SelectUserColumns } from "~/server/db/queries/user";

export const groupRouter = createTRPCRouter({
  list: privateProcedure.query(async ({ ctx }) => {
    const groups = await queries.group.list(
      ctx,
      {
        userId: ctx.userId,
      },
      {
        memberships: {
          with: { user: SelectUserColumns },
        },
      },
    );
    return groups.map((group) => {
      const { memberships, ...rest } = group;
      return {
        ...rest,
        members: memberships.map((m) => m.user),
        memberIds: memberships.map((m) => m.userId),
      };
    });
  }),
  get: groupGetHandler,
  create: groupCreateHandler,
  join: groupJoinHandler,
  edit: groupEditHandler,
  archive: groupArchiveHandler,
});
