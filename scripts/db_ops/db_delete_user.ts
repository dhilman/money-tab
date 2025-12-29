import { eq, inArray, or } from "drizzle-orm";
import { db, schema } from "~/server/db";

const userId = "jcg4crwwa4rfcnb7lzv80mo8";

// find all transaction ids where user is a contributor
const results = await db
  .select({
    transactionId: schema.contribution.transactionId,
  })
  .from(schema.contribution)
  .where(eq(schema.contribution.userId, userId))
  .groupBy(schema.contribution.transactionId);

console.log("Number of transactions to delete:", results.length);

const txIds = results.map((r) => r.transactionId);

await db
  .delete(schema.transaction)
  .where(inArray(schema.transaction.id, txIds));

// delete all contributions where user is a contributor
await db
  .delete(schema.contribution)
  .where(inArray(schema.contribution.transactionId, txIds));

// delete all connections where user is fromUserId or toUserId
await db
  .delete(schema.connection)
  .where(
    or(
      eq(schema.connection.ownerId, userId),
      eq(schema.connection.userId, userId)
    )
  );

// delete user
await db.delete(schema.user).where(eq(schema.user.id, userId));
