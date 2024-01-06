import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/duplicated_asset.model.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/android_device_asset.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/etag.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/ios_device_asset.dart';
import 'package:immich_mobile/shared/models/logger_message.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';

import 'mock_http_override.dart';

// Listener Mock to test when a provider notifies its listeners
class ListenerMock<T> extends Mock {
  void call(T? previous, T next);
}

final class TestUtils {
  const TestUtils._();

  /// Downloads Isar binaries (if required) and initializes a new Isar db
  static Future<Isar> initIsar() async {
    await Isar.initializeIsarCore(download: true);

    final instance = Isar.getInstance();
    if (instance != null) {
      return instance;
    }

    final db = await Isar.open(
      [
        StoreValueSchema,
        ExifInfoSchema,
        AssetSchema,
        AlbumSchema,
        UserSchema,
        BackupAlbumSchema,
        DuplicatedAssetSchema,
        LoggerMessageSchema,
        ETagSchema,
        AndroidDeviceAssetSchema,
        IOSDeviceAssetSchema,
      ],
      maxSizeMiB: 256,
      directory: "test/",
    );

    // Clear and close db on test end
    addTearDown(() async {
      await db.writeTxn(() => db.clear());
      await db.close();
    });
    return db;
  }

  /// Creates a new ProviderContainer to test Riverpod providers
  static ProviderContainer createContainer({
    ProviderContainer? parent,
    List<Override> overrides = const [],
    List<ProviderObserver>? observers,
  }) {
    final container = ProviderContainer(
      parent: parent,
      overrides: overrides,
      observers: observers,
    );

    // Dispose on test end
    addTearDown(container.dispose);

    return container;
  }

  static void init() {
    // Turn off easy localization logging
    EasyLocalization.logger.enableBuildModes = [];
    WidgetController.hitTestWarningShouldBeFatal = true;
    HttpOverrides.global = MockHttpOverrides();
  }
}
