import { beforeEach, expect, it, vi } from 'vitest';
import { uploadPhoto } from './media';

const mocks = vi.hoisted(() => ({
  uploadAsync: vi.fn(),
  presign: vi.fn(),
  claimPhoto: vi.fn(),
}));
vi.mock('expo-file-system/legacy', () => ({
  uploadAsync: mocks.uploadAsync,
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));
vi.mock('./endpoints', () => ({ media: { presign: mocks.presign, claimPhoto: mocks.claimPhoto } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.presign.mockResolvedValue({ key: 'owner/upload.heic', upload_url: 'https://storage.test/upload' });
  mocks.uploadAsync.mockResolvedValue({ status: 200 });
  mocks.claimPhoto.mockResolvedValue({ id: 'photo', url: 'https://storage.test/photo.webp', position: 0 });
});

it.each([['heic', 'image/heic'], ['heif', 'image/heif'], ['avif', 'image/avif'], ['png', 'image/png'], ['jpg', 'image/jpeg'], ['webp', 'image/webp'], ['gif', 'image/gif'], ['tiff', 'image/tiff'], ['bmp', 'image/bmp']])('preserves %s MIME type for backend normalization', async (extension, mime) => {
  const photo = await uploadPhoto(`file:///photo.${extension}`);
  expect(mocks.presign).toHaveBeenCalledWith({ filename: `photo.${extension}`, content_type: mime });
  expect(mocks.uploadAsync).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ headers: { 'Content-Type': mime } }));
  expect(photo.url).toMatch(/webp$/);
});

it('does not claim an upload rejected by storage', async () => {
  mocks.uploadAsync.mockResolvedValueOnce({ status: 403 });
  await expect(uploadPhoto('file:///photo.heic')).rejects.toThrow('403');
  expect(mocks.claimPhoto).not.toHaveBeenCalled();
});
