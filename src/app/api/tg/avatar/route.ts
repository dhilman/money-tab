import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import type { z } from "zod";
import { env } from "~/env.mjs";
import { bot } from "~/server/bot/bot";
import { db, mutate, type DbCtx } from "~/server/db";
import logger from "~/server/logger";
import { monitor } from "~/server/monitor/monitor";
import { AvatarMessageSchema } from "~/server/queue/messages";
import { queueReceiver } from "~/server/queue/receiver";
import { monitoredEdgeHandler } from "~/utils/handler_wrapper";
import { newEdgeRequest } from "~/utils/request";

const POST = monitoredEdgeHandler(handler);
export { POST };

async function handler(req: NextRequest) {
  let body: unknown;
  try {
    body = await queueReceiver.verify(req);
  } catch (e) {
    monitor.captureWithReq(e, newEdgeRequest(req));
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }

  const parsed = AvatarMessageSchema.safeParse(body);
  if (!parsed.success) {
    monitor.captureWithReq(parsed.error, newEdgeRequest(req));
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }

  try {
    await saveAvatar({ db }, parsed.data);
  } catch (e) {
    monitor.captureWithReq(e, newEdgeRequest(req), { properties: parsed.data });
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

async function saveAvatar(
  ctx: DbCtx,
  params: z.infer<typeof AvatarMessageSchema>,
) {
  logger.info(params, "Saving avatar");
  const profile = await getChatPhotoAndColor(params.tgId);
  if (!profile) return;

  let photoUrl;
  if (profile.photo) {
    photoUrl = await uploadAvatatToS3({
      fileId: profile.photo.hash,
      entityId: params.id,
      entityType: params.type,
      buffer: profile.photo.buffer,
      format: profile.photo.format,
    });
  }

  switch (params.type) {
    case "USER":
      await mutate.user.updateById(ctx, params.id, {
        photoUrl,
        accentColorId: profile.accentColorId,
      });
      break;
    case "GROUP":
      await mutate.group.updateById(ctx, params.id, {
        photoUrl,
        accentColorId: profile.accentColorId,
      });
      break;
  }

  logger.info(
    {
      id: params.id,
      type: params.type,
      photoUrl,
    },
    "Avatar saved",
  );
}

async function uploadAvatatToS3(params: {
  fileId: string;
  entityType: "USER" | "GROUP";
  entityId: string;
  buffer: ArrayBuffer;
  format: string;
}) {
  function newKey() {
    const prefix = env.S3_PREFIX ? `${env.S3_PREFIX}/` : "";
    const fname = `${params.entityId}/${params.fileId}.${params.format}`;
    switch (params.entityType) {
      case "USER":
        return `${prefix}avatar/${fname}`;
      case "GROUP":
        return `${prefix}group/${fname}`;
    }
  }

  const key = newKey();
  const publicUrl = `${env.S3_URL}/${key}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: new Uint8Array(params.buffer),
      ContentType: `image/${params.format}`,
      CacheControl: "public, max-age=31536000",
      ...(params.entityType === "USER" && {
        Metadata: {
          "x-amz-meta-user": params.entityId,
        },
      }),
    }),
  );

  return publicUrl;
}

/**
 * Gets the chat photo and accent color from Telegram
 * ChatId can be a group or a user
 */
async function getChatPhotoAndColor(chatId: number) {
  const chat = await bot.api.getChat(chatId);
  if (!chat) return null;

  let photo = null;
  if (chat.photo?.small_file_id) {
    photo = await downloadTelegramFile(chat.photo.small_file_id);
  } else if (chat.photo?.big_file_id) {
    photo = await downloadTelegramFile(chat.photo.big_file_id);
  }

  return {
    photo,
    type: chat.type,
    accentColorId: chat?.accent_color_id ?? undefined,
  };
}

async function downloadTelegramFile(fileId: string) {
  const file = await bot.api.getFile(fileId);
  if (!file || !file.file_path) return null;

  const url = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${file.file_path}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const format = file.file_path.split(".").pop() as string;

  const buffer = await res.arrayBuffer();

  return {
    hash: await hashBuffer(buffer),
    buffer: buffer,
    format: format,
  };
}

async function hashBuffer(buffer: ArrayBuffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, 10);
}
