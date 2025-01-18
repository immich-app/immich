import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/entities/logger_message.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:isar/isar.dart';

abstract final class InfraBootstrap {
  const InfraBootstrap._();

  static Future<Isar> initDB({required String path}) async {
    return await Isar.open(
      [
        StoreEntitySchema,
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
      directory: path,
      inspector: kDebugMode,
    );
  }
}
