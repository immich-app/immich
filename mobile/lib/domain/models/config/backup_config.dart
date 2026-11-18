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
    // 默认开启：上游的后台备份一直是开箱即用的，这个开关只是给
    // 「想省电 / 不想让 App 在后台跑」的人关掉用。默认 false 会让
    // 所有老用户升级后后台备份静默停止（DB 里没这个 key，
    // SettingsRepository 会回落到这里的默认值）。
    @Default(true) bool backgroundSync,
  }) = _BackupConfig;
}
