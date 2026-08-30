import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';

import { media } from './endpoints';
import type { PhotoOut } from './schema';

/**
 * A photograph, from the camera roll to the object store.
 *
 * Three steps, and the middle one deliberately does not go through this API:
 * the server signs a URL, the phone PUTs the bytes straight at MinIO (or R2
 * later - same protocol), and only then does the server hear that the object
 * exists. Streaming images through the API would double the bandwidth and put
 * a request timeout between a person and their own face.
 *
 * `uploadAsync` rather than fetch+blob: a presigned PUT needs the raw bytes,
 * and reading a `file://` URI into a blob in React Native is the kind of thing
 * that works on one platform.
 */

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/jpeg',
};

function describe(uri: string): { filename: string; contentType: string } {
  const clean = uri.split('?')[0];
  const name = clean.split('/').pop() || `photo-${Date.now()}.jpg`;
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : 'jpg';
  // The server only accepts three types; anything exotic is declared as JPEG,
  // which is what the picker hands back for a HEIC anyway.
  return { filename: name, contentType: TYPES[extension] ?? 'image/jpeg' };
}

export class UploadError extends Error {}

/** Uploads one local image and returns the row the server created for it. */
export async function uploadPhoto(uri: string): Promise<PhotoOut> {
  const { filename, contentType } = describe(uri);
  const ticket = await media.presign({ filename, content_type: contentType });

  const result = await uploadAsync(ticket.upload_url, uri, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': contentType },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new UploadError(`The store refused the upload (${result.status})`);
  }

  // Claiming is what ties the object to the account; an unclaimed object is
  // orphaned rather than owned, which is the safe way round.
  return media.claimPhoto(ticket.key);
}
