import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';

part 'server_info.model.freezed.dart';

enum VersionStatus {
  upToDate,
  clientOutOfDate,
  serverOutOfDate,
  error;

  String get message => switch (this) {
    VersionStatus.upToDate => "",
    VersionStatus.clientOutOfDate => StaticTranslations.instance.app_update_available,
    VersionStatus.serverOutOfDate => StaticTranslations.instance.server_update_available,
    VersionStatus.error => StaticTranslations.instance.unable_to_check_version,
  };
}

@freezed
abstract class ServerInfo with _$ServerInfo {
  const factory ServerInfo({
    required ServerVersion serverVersion,
    ServerVersion? latestVersion,
    required ServerFeatures serverFeatures,
    required ServerConfig serverConfig,
    required ServerDiskInfo serverDiskInfo,
    required VersionStatus versionStatus,
  }) = _ServerInfo;
}
