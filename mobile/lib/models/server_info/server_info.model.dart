import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
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
    VersionStatus.clientOutOfDate => "app_update_available".tr(),
    VersionStatus.serverOutOfDate => "server_update_available".tr(),
    VersionStatus.error => "unable_to_check_version".tr(),
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
