import { env } from "~/env.mjs";
import { db, mutate } from "~/server/db";
import * as schema from "~/server/db/schema";
import { type InsertUser } from "~/server/db/types";
import { inputConfirm } from "../utils";

const USERS: InsertUser[] = [
  {
    id: "bqe9coc9ddibghni89af1su3",
    telegramId: env.MOCK_TG_USER_ID ?? 100000001,
    username: "TestUser",
    firstName: "Test",
    lastName: "User",
    isRegistered: true,
  },
  {
    id: "aw0ebrpnciry5vmoorys32s9",
    telegramId: 1,
    username: "1",
    firstName: "Alice",
    lastName: "Smith",
    isRegistered: true,
    photoUrl: "/tmp/avatar/alice.jpg",
  },
  {
    id: "s0yr2rerb07gi1bzkasi5s6c",
    telegramId: 2,
    username: "2",
    firstName: "Bob",
    lastName: "Graham",
    isRegistered: true,
    photoUrl: "/tmp/avatar/bob.jpg",
  },
  {
    id: "q1akll3btqivuq0w9ixha2fc",
    telegramId: 3,
    username: "3",
    firstName: "John",
    lastName: "Doe",
    isRegistered: true,
  },
  {
    id: "hofqgiu628du84vlns0wkdos",
    telegramId: 4,
    username: "4",
    firstName: "Will",
    photoUrl: "/tmp/avatar/will.jpg",
    isRegistered: true,
  },
];

async function seed() {
  await inputConfirm(`Seed database at ${env.DATABASE_URL}?`);

  for (const user of USERS) {
    const existing = await db.query.user.findFirst({
      where: (v, { eq }) => eq(v.telegramId, user.telegramId ?? 0),
    });
    if (existing) continue;
    await db.insert(schema.user).values(user).execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user1 = USERS[0]!;

  for (const user of USERS) {
    if (user.id === user1.id) continue;
    const ctx = { db, userId: user1.id };
    await mutate.contact.upsert(ctx, user.id);
  }

  console.log("Seeded");
}

await seed();
