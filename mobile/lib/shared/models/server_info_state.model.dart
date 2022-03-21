import 'dart:convert';

import 'package:immich_mobile/shared/models/mapbox_info.model.dart';
import 'package:immich_mobile/shared/models/server_version.model.dart';

class ServerInfoState {
  final MapboxInfo mapboxInfo;
  final ServerVersion serverVersion;
  final bool isVersionMismatch;
  final String versionMismatchErrorMessage;

  ServerInfoState({
    required this.mapboxInfo,
    required this.serverVersion,
    required this.isVersionMismatch,
    required this.versionMismatchErrorMessage,
  });

  ServerInfoState copyWith({
    MapboxInfo? mapboxInfo,
    ServerVersion? serverVersion,
    bool? isVersionMismatch,
    String? versionMismatchErrorMessage,
  }) {
    return ServerInfoState(
      mapboxInfo: mapboxInfo ?? this.mapboxInfo,
      serverVersion: serverVersion ?? this.serverVersion,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
      versionMismatchErrorMessage: versionMismatchErrorMessage ?? this.versionMismatchErrorMessage,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'mapboxInfo': mapboxInfo.toMap(),
      'serverVersion': serverVersion.toMap(),
      'isVersionMismatch': isVersionMismatch,
      'versionMismatchErrorMessage': versionMismatchErrorMessage,
    };
  }

  factory ServerInfoState.fromMap(Map<String, dynamic> map) {
    return ServerInfoState(
      mapboxInfo: MapboxInfo.fromMap(map['mapboxInfo']),
      serverVersion: ServerVersion.fromMap(map['serverVersion']),
      isVersionMismatch: map['isVersionMismatch'] ?? false,
      versionMismatchErrorMessage: map['versionMismatchErrorMessage'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerInfoState.fromJson(String source) => ServerInfoState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ServerInfoState(mapboxInfo: $mapboxInfo, serverVersion: $serverVersion, isVersionMismatch: $isVersionMismatch, versionMismatchErrorMessage: $versionMismatchErrorMessage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfoState &&
        other.mapboxInfo == mapboxInfo &&
        other.serverVersion == serverVersion &&
        other.isVersionMismatch == isVersionMismatch &&
        other.versionMismatchErrorMessage == versionMismatchErrorMessage;
  }

  @override
  int get hashCode {
    return mapboxInfo.hashCode ^
        serverVersion.hashCode ^
        isVersionMismatch.hashCode ^
        versionMismatchErrorMessage.hashCode;
  }
}
