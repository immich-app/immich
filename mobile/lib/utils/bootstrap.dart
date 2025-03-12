import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';

abstract final class Bootstrap {
  static Future<Isar> initIsar() async {
    if (Isar.getInstance() != null) {
      return Isar.getInstance()!;
    }

    final dir = await getApplicationDocumentsDirectory();
    return await Isar.open(
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
        if (Platform.isAndroid) AndroidDeviceAssetSchema,
        if (Platform.isIOS) IOSDeviceAssetSchema,
      ],
      directory: dir.path,
      maxSizeMiB: 1024,
      inspector: kDebugMode,
    );
  }

  static Future<void> initDomain(Isar db) async {
    await StoreService.init(storeRepository: IsarStoreRepository(db));
    await LogService.init(
      logRepository: IsarLogRepository(db),
      storeRepository: IsarStoreRepository(db),
    );
  }
}
