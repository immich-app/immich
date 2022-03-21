import 'dart:convert';

import 'package:immich_mobile/shared/models/mapbox_info.model.dart';
import 'package:immich_mobile/shared/models/server_version.model.dart';

class ServerInfoState {
  final MapboxInfo mapboxInfo;
  final ServerVersion serverVersion;
  final bool isVersionMismatch;
  ServerInfoState({
    required this.mapboxInfo,
    required this.serverVersion,
    required this.isVersionMismatch,
  });

  ServerInfoState copyWith({
    MapboxInfo? mapboxInfo,
    ServerVersion? serverVersion,
    bool? isVersionMismatch,
  }) {
    return ServerInfoState(
      mapboxInfo: mapboxInfo ?? this.mapboxInfo,
      serverVersion: serverVersion ?? this.serverVersion,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'mapboxInfo': mapboxInfo.toMap(),
      'serverVersion': serverVersion.toMap(),
      'isVersionMismatch': isVersionMismatch,
    };
  }

  factory ServerInfoState.fromMap(Map<String, dynamic> map) {
    return ServerInfoState(
      mapboxInfo: MapboxInfo.fromMap(map['mapboxInfo']),
      serverVersion: ServerVersion.fromMap(map['serverVersion']),
      isVersionMismatch: map['isVersionMismatch'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerInfoState.fromJson(String source) => ServerInfoState.fromMap(json.decode(source));

  @override
  String toString() =>
      'ServerInfoState(mapboxInfo: $mapboxInfo, serverVersion: $serverVersion, isVersionMismatch: $isVersionMismatch)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfoState &&
        other.mapboxInfo == mapboxInfo &&
        other.serverVersion == serverVersion &&
        other.isVersionMismatch == isVersionMismatch;
  }

  @override
  int get hashCode => mapboxInfo.hashCode ^ serverVersion.hashCode ^ isVersionMismatch.hashCode;
}
