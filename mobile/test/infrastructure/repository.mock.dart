import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_migration.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockDriftStoreRepository extends Mock implements DriftStoreRepository {}

class MockSettingsRepository extends Mock implements SettingsRepository {}

class MockLogRepository extends Mock implements LogRepository {}

class MockSyncStreamRepository extends Mock implements SyncStreamRepository {}

class MockLocalAlbumRepository extends Mock implements DriftLocalAlbumRepository {}

class MockRemoteAlbumRepository extends Mock implements DriftRemoteAlbumRepository {}

class MockLocalAssetRepository extends Mock implements DriftLocalAssetRepository {}

class MockDriftLocalAssetRepository extends Mock implements DriftLocalAssetRepository {}

class MockRemoteAssetRepository extends Mock implements RemoteAssetRepository {}

class MockTrashSyncRepository extends Mock implements DriftTrashSyncRepository {}

class MockStorageRepository extends Mock implements StorageRepository {}

class MockDriftBackupRepository extends Mock implements DriftBackupRepository {}

class MockUploadRepository extends Mock implements UploadRepository {}

class MockSyncMigrationRepository extends Mock implements SyncMigrationRepository {}

class MockUserRepository extends Mock implements UserRepository {}

class MockPartnerRepository extends Mock implements PartnerRepository {}

// API Repos
class MockUserApiRepository extends Mock implements UserApiRepository {}

class MockSyncApiRepository extends Mock implements SyncApiRepository {}

class MockDriftAlbumApiRepository extends Mock implements DriftAlbumApiRepository {}
