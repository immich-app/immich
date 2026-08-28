// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'local_album.model.freezed.dart';

enum BackupSelection {
  // Used to sort albums based on the backupSelection
  // selected -> none -> excluded
  // Do not change the order of these values
  selected,
  none,
  excluded,
}

@freezed
class const LocalAlbum({
  required final String id,
  required final String name,
  required final DateTime updatedAt,
  final int assetCount = 0,
  final BackupSelection backupSelection = .none,
  final bool isIosSharedAlbum = false,
  final String? linkedRemoteAlbumId,
}) with _$LocalAlbum;
