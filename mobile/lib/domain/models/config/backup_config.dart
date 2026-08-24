// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'backup_config.freezed.dart';

@freezed
class const BackupConfig({
  final bool enabled = false,
  final bool useCellularForVideos = false,
  final bool useCellularForPhotos = false,
  final bool requireCharging = false,
  final int triggerDelay = 30,
  final bool syncAlbums = false,
}) with _$BackupConfig;
