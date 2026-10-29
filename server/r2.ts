import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

type R2Config = {
  client: S3Client
  bucket: string
  publicBaseUrl: string
}

function readConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "")

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw Object.assign(
      new Error("Set the R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL variables."),
      { status: 503 },
    )
  }

  return {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  }
}

let config: R2Config | undefined

function r2() {
  config ??= readConfig()
  return config
}

export function publicUrl(objectKey: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "")
  if (!publicBaseUrl) {
    throw Object.assign(
      new Error("Set R2_PUBLIC_BASE_URL to the public address of the R2 bucket."),
      { status: 503 },
    )
  }
  return `${publicBaseUrl}/${objectKey}`
}

export async function putObject(objectKey: string, body: Uint8Array, contentType: string) {
  const current = r2()
  await current.client.send(
    new PutObjectCommand({
      Bucket: current.bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  )
  return publicUrl(objectKey)
}

export async function deleteObject(objectKey: string) {
  const current = r2()
  await current.client.send(
    new DeleteObjectCommand({
      Bucket: current.bucket,
      Key: objectKey,
    }),
  )
}

export async function deletePrefix(prefix: string) {
  const current = r2()
  let continuationToken: string | undefined

  do {
    const listing = await current.client.send(
      new ListObjectsV2Command({
        Bucket: current.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )
    const keys =
      listing.Contents?.map((item) => item.Key).filter((key): key is string => Boolean(key)) ?? []

    if (keys.length) {
      await current.client.send(
        new DeleteObjectsCommand({
          Bucket: current.bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      )
    }

    continuationToken = listing.IsTruncated ? listing.NextContinuationToken : undefined
  } while (continuationToken)
}
