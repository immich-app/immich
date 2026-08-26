// ignore_for_file: annotate_overrides

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
class const ServerInfo({
  required final ServerVersion serverVersion,
  final ServerVersion? latestVersion,
  required final ServerFeatures serverFeatures,
  required final ServerConfig serverConfig,
  required final ServerDiskInfo serverDiskInfo,
  required final VersionStatus versionStatus,
}) with _$ServerInfo;
