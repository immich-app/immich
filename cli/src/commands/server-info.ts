import { getAssetStatistics, getServerVersion, getSupportedMediaTypes, getMyUserInfo } from '@immich/sdk';
import { BaseOptions, authenticate } from 'src/utils';

export const serverInfo = async (options: BaseOptions) => {
  await authenticate(options);

  const versionInfo = await getServerVersion();
  const mediaTypes = await getSupportedMediaTypes();
  const stats = await getAssetStatistics({});
  const userInfo = getMyUserInfo();

  console.log(`Server URL: ${options.url}`);
  console.log(`User email: ${userInfo.email}`);
  console.log(`Server Version: ${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`);
  console.log(`Image Types: ${mediaTypes.image.map((extension) => extension.replace('.', ''))}`);
  console.log(`Video Types: ${mediaTypes.video.map((extension) => extension.replace('.', ''))}`);
  console.log(`Statistics:\n  Images: ${stats.images}\n  Videos: ${stats.videos}\n  Total: ${stats.total}`);
};
