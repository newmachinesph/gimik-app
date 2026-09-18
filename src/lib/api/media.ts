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
  heic: 'image/heic',
  heif: 'image/heif',
  hif: 'image/heif',
  avif: 'image/avif',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
};

function describe(uri: string): { filename: string; contentType: string } {
  const clean = uri.split('?')[0];
  const name = clean.split('/').pop() || `photo-${Date.now()}.jpg`;
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : 'jpg';
  // The backend checks the actual bytes and normalizes supported images to WebP.
  // Keep the original type when the picker preserves an iPhone HEIC/HEIF file.
  return { filename: name, contentType: TYPES[extension] ?? 'image/jpeg' };
}

export class UploadError extends Error {}

/** Upload raw bytes; the claiming endpoint validates and normalizes the image. */
export async function uploadImage(uri: string): Promise<string> {
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

  return ticket.key;
}

/** Uploads one profile image and returns the normalized photo row. */
export async function uploadPhoto(uri: string): Promise<PhotoOut> {
  return media.claimPhoto(await uploadImage(uri));
}
