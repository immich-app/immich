import { getAssetStatistics, getMyUser, getServerVersion, getSupportedMediaTypes, Permission } from '@immich/sdk';
import { authenticate, BaseOptions, requirePermissions } from 'src/utils';

export const serverInfo = async (options: BaseOptions) => {
  const { url } = await authenticate(options);
  await requirePermissions([Permission.ServerAbout, Permission.AssetStatistics, Permission.UserRead]);

  const [versionInfo, mediaTypes, stats, userInfo] = await Promise.all([
    getServerVersion(),
    getSupportedMediaTypes(),
    getAssetStatistics({}),
    getMyUser(),
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
