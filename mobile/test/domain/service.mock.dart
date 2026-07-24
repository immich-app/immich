import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreService extends Mock implements StoreService {}

class MockBackgroundSyncManager extends Mock implements BackgroundSyncManager {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

class MockAssetMediaApi extends Mock implements AssetMediaApi {}

class MockTrashSyncService extends Mock implements TrashSyncService {}

class MockAppSettingsService extends Mock implements AppSettingsService {}

class MockPartnerService extends Mock implements PartnerService {}

class MockAssetService extends Mock implements AssetService {}

class MockUserService extends Mock implements UserService {}
