import 'dart:convert';

import 'package:immich_mobile/shared/models/server_version.model.dart';

class ServerInfoState {
  final ServerVersion serverVersion;
  final bool isVersionMismatch;
  final String versionMismatchErrorMessage;

  ServerInfoState({
    required this.serverVersion,
    required this.isVersionMismatch,
    required this.versionMismatchErrorMessage,
  });

  ServerInfoState copyWith({
    ServerVersion? serverVersion,
    bool? isVersionMismatch,
    String? versionMismatchErrorMessage,
  }) {
    return ServerInfoState(
      serverVersion: serverVersion ?? this.serverVersion,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
      versionMismatchErrorMessage:
          versionMismatchErrorMessage ?? this.versionMismatchErrorMessage,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'serverVersion': serverVersion.toMap(),
      'isVersionMismatch': isVersionMismatch,
      'versionMismatchErrorMessage': versionMismatchErrorMessage,
    };
  }

  factory ServerInfoState.fromMap(Map<String, dynamic> map) {
    return ServerInfoState(
      serverVersion: ServerVersion.fromMap(map['serverVersion']),
      isVersionMismatch: map['isVersionMismatch'] ?? false,
      versionMismatchErrorMessage: map['versionMismatchErrorMessage'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerInfoState.fromJson(String source) =>
      ServerInfoState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ServerInfoState( serverVersion: $serverVersion, isVersionMismatch: $isVersionMismatch, versionMismatchErrorMessage: $versionMismatchErrorMessage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfoState &&
        other.serverVersion == serverVersion &&
        other.isVersionMismatch == isVersionMismatch &&
        other.versionMismatchErrorMessage == versionMismatchErrorMessage;
  }

  @override
  int get hashCode {
    return serverVersion.hashCode ^
        isVersionMismatch.hashCode ^
        versionMismatchErrorMessage.hashCode;
  }
}
