import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

enum LegacyStoreKey {
  deviceId(4),
  legacyVersion(0),
  legacyManageLocalMediaAndroid(137),
  legacySyncMigrationStatus(1013),
  legacyAdvancedTroubleshooting(114),
  legacyEnableHapticFeedback(126),
  legacyReadonlyModeEnabled(138),
  legacyServerUrl(10),
  legacyAccessToken(11),
  legacyServerEndpoint(12),
  legacyBackupRequireCharging(7),
  legacyBackupTriggerDelay(8),
  legacySyncAlbums(131),
  legacyEnableBackup(1003),
  legacyUseWifiForUploadVideos(1004),
  legacyUseWifiForUploadPhotos(1005),
  legacySelectedAlbumSortOrder(113),
  legacySelectedAlbumSortReverse(123),
  legacyAlbumGridView(140),
  legacyAutoEndpointSwitching(132),
  legacyPreferredWifiName(133),
  legacyLocalEndpoint(134),
  legacyExternalEndpointList(135),
  legacyCustomHeaders(127),
  legacyLoopVideo(117),
  legacyLoadOriginalVideo(136),
  legacyAutoPlayVideo(139),
  legacyTapToNavigate(141),
  legacyPreferRemoteImage(116),
  legacyLoadOriginal(101),
  legacyPrimaryColor(128),
  legacyDynamicTheme(129),
  legacyColorfulInterface(130),
  legacyThemeMode(102),
  legacyCleanupKeepFavorites(1008),
  legacyCleanupKeepMediaType(1009),
  legacyCleanupKeepAlbumIds(1010),
  legacyCleanupCutoffDaysAgo(1011),
  legacyCleanupDefaultsInitialized(1012),
  legacyTilesPerRow(103),
  legacyGroupAssetsBy(105),
  legacyStorageIndicator(109),
  legacyMapRelativeDate(119),
  legacyMapShowFavoriteOnly(118),
  legacyMapIncludeArchived(121),
  legacyMapThemeMode(124),
  legacyMapwithPartners(125),
  legacyLogLevel(115);

  const LegacyStoreKey(this.id);

  final int id;
}

class DeviceIdStore {
  DeviceIdStore._(this._db);

  final Drift _db;
  String? _deviceId;

  static DeviceIdStore? _instance;
  static DeviceIdStore get I => _instance ?? (throw StateError('DeviceIdStore not initialized. Call init() first'));

  static Future<DeviceIdStore> init(Drift db) async {
    final instance = DeviceIdStore._(db);
    final row = await (db.storeEntity.select()..where((t) => t.id.equals(LegacyStoreKey.deviceId.id)))
        .getSingleOrNull();
    instance._deviceId = row?.stringValue;
    return _instance = instance;
  }

  String? get deviceId => _deviceId;

  String get requireDeviceId => _deviceId ?? (throw StateError('deviceId not set'));

  Future<void> setDeviceId(String value) async {
    if (_deviceId == value) {
      return;
    }
    await _db.storeEntity.insertOnConflictUpdate(
      StoreEntityCompanion(id: Value(LegacyStoreKey.deviceId.id), stringValue: Value(value)),
    );
    _deviceId = value;
  }

  Future<void> clear() async {
    await _db.storeEntity.deleteAll();
    _deviceId = null;
  }

  Future<void> dispose() async {
    _deviceId = null;
    if (identical(_instance, this)) {
      _instance = null;
    }
  }
}

// ignore: non_constant_identifier_names
DeviceIdStore get Store => DeviceIdStore.I;
