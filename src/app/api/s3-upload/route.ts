import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createId } from "@paralleldrive/cuid2";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import { authenticate } from "~/server/auth";
import { db } from "~/server/db";
import { monitoredEdgeHandler } from "~/utils/handler_wrapper";
import { newEdgeRequest } from "~/utils/request";

const POST = monitoredEdgeHandler(handler);
export { POST };

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

const ReqSchema = z.object({
  type: z.string(),
});

async function handler(req: NextRequest) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  const user = await authenticate({
    db,
    req: newEdgeRequest(req),
    res: {
      appendHeader: (key, value) => headers.append(key, value),
    },
    user: null,
  });

  const body = (await req.json()) as unknown;
  const { type } = ReqSchema.parse(body);

  const fileExtension = type.split("/")[1]!;

  const id = createId();

  function getKey() {
    const k = `uploads/${id}.${fileExtension}`;
    if (env.S3_PREFIX) return `${env.S3_PREFIX}/${k}`;
    return k;
  }

  const key = getKey();

  // generate a presigned URL
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: type,
    CacheControl: "public, max-age=604800", // 1 week
    Metadata: {
      "x-amz-meta-user-id": user.id,
    },
  });

  const url = `${env.S3_URL}/${key}`;
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  console.log("presigned", {
    uploadUrl,
    url,
    id,
    type,
  });

  return new Response(JSON.stringify({ uploadUrl, url, id, key }), {
    headers,
  });
}
