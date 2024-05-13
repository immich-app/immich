import { getAssetStatistics, getMyUserInfo, getServerVersion, getSupportedMediaTypes } from '@immich/sdk';
import { BaseOptions, authenticate } from 'src/utils';

export const serverInfo = async (options: BaseOptions) => {
  const { url } = await authenticate(options);

  const [versionInfo, mediaTypes, stats, userInfo] = await Promise.all([
    getServerVersion(),
    getSupportedMediaTypes(),
    getAssetStatistics({}),
    getMyUserInfo(),
  ]);

  console.log(`Server Info (via ${userInfo.email})`);
  console.log(`  Url: ${url}`);
  console.log(`  Version: ${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`);
  console.log(`  Formats:`);
  console.log(`    Images: ${mediaTypes.image.map((extension) => extension.replace('.', ''))}`);
  console.log(`    Videos: ${mediaTypes.video.map((extension) => extension.replace('.', ''))}`);
  console.log(`  Statistics:`);
  console.log(`    Images: ${stats.images}`);
  console.log(`    Videos: ${stats.videos}`);
  console.log(`    Total: ${stats.total}`);
};
