import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/cleanup.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:mocktail/mocktail.dart';

class MockApiService extends Mock implements ApiService {}

class MockNetworkService extends Mock implements NetworkService {}

class MockAppSettingService extends Mock implements AppSettingsService {}

class MockStoreService extends Mock implements StoreService {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

class MockAppSettingsService extends Mock implements AppSettingsService {}

class MockPartnerService extends Mock implements PartnerService {}

class MockAssetService extends Mock implements AssetService {}

class MockUserService extends Mock implements UserService {}

class MockRemoteAlbumService extends Mock implements RemoteAlbumService {}

class MockGCastService extends Mock implements GCastService {}

class MockForegroundUploadService extends Mock implements ForegroundUploadService {}

class MockServerInfoService extends Mock implements ServerInfoService {}

class MockCleanupService extends Mock implements CleanupService {}

class MockBackgroundSyncManager extends Mock implements BackgroundSyncManager {}
