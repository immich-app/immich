import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/server-info/server_version.model.dart';
import 'package:immich_mobile/utils/extensions/string.extension.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AppInfoProvider extends ValueNotifier<AppInfo> {
  AppInfoProvider() : super(const AppInfo.initial()) {
    unawaited(_getAppVersion());
  }

  Future<void> _getAppVersion() async {
    final version = (await PackageInfo.fromPlatform()).version;

    final segments = version.split(".");

    final major = segments.firstOrNull ?? '1';
    final minor = segments.elementAtOrNull(1) ?? '0';
    final patch = segments.elementAtOrNull(2)?.replaceAll("-DEBUG", "") ?? '0';

    value = value.copyWith(
      versionString: version,
      version: ServerVersion(
        major: major.parseInt(),
        minor: minor.parseInt(),
        patch: patch.parseInt(),
      ),
    );
  }

  void checkVersionMismatch(ServerVersion? serverVersion) {
    if (serverVersion == null) {
      value = value.copyWith(
        isVersionMismatch: true,
        versionMismatchError:
            "common.components.appbar.server_version_common_error",
      );
      return;
    }

    String? errorMessage;
    if (value.version.major != serverVersion.major) {
      errorMessage = value.version.major > serverVersion.major
          ? "common.components.appbar.server_version_major_error"
          : "common.components.appbar.app_version_major_error";
    } else if (value.version.minor != serverVersion.minor) {
      errorMessage = value.version.minor > serverVersion.minor
          ? "common.components.appbar.server_version_minor_error"
          : "common.components.appbar.app_version_minor_error";
    }

    value = value.copyWith(
      isVersionMismatch: errorMessage != null,
      versionMismatchError: errorMessage ??
          "common.components.appbar.server_version_common_error",
    );
  }
}

class AppInfo {
  final String versionString;
  final ServerVersion version;
  final bool isVersionMismatch;
  final String versionMismatchError;

  const AppInfo({
    required this.versionString,
    required this.version,
    required this.isVersionMismatch,
    required this.versionMismatchError,
  });

  const AppInfo.initial()
      : versionString = '1.0.0',
        version = const ServerVersion.initial(),
        isVersionMismatch = false,
        versionMismatchError = '';

  AppInfo copyWith({
    String? versionString,
    ServerVersion? version,
    bool? isVersionMismatch,
    String? versionMismatchError,
  }) {
    return AppInfo(
      versionString: versionString ?? this.versionString,
      version: version ?? this.version,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
      versionMismatchError: versionMismatchError ?? this.versionMismatchError,
    );
  }

  @override
  String toString() =>
      'AppInfo(versionString: $versionString, isVersionMismatch: $isVersionMismatch, versionMismatchError: $versionMismatchError)';

  @override
  bool operator ==(covariant AppInfo other) {
    if (identical(this, other)) return true;

    return other.versionString == versionString &&
        other.isVersionMismatch == isVersionMismatch &&
        other.versionMismatchError == versionMismatchError;
  }

  @override
  int get hashCode =>
      versionString.hashCode ^
      isVersionMismatch.hashCode ^
      versionMismatchError.hashCode;
}
