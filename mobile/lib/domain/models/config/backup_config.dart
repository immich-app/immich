import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'backup_config.freezed.dart';

@freezed
abstract class BackupConfig with _$BackupConfig {
  const factory BackupConfig({
    @Default(false) bool enabled,
    @Default(false) bool useCellularForVideos,
    @Default(false) bool useCellularForPhotos,
    @Default(false) bool requireCharging,
    @Default(30) int triggerDelay,
    @Default(false) bool syncAlbums,
    // 默认开启，否则老用户升级后后台上传会静默停掉。
    @Default(true) bool backgroundSync,
  }) = _BackupConfig;
}
