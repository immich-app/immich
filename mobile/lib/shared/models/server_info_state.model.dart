import 'package:openapi/api.dart';

class ServerInfoState {
  final ServerVersionResponseDto serverVersion;
  final ServerFeaturesDto serverFeatures;
  final ServerConfigDto serverConfig;
  final bool isVersionMismatch;
  final String versionMismatchErrorMessage;

  ServerInfoState({
    required this.serverVersion,
    required this.serverFeatures,
    required this.serverConfig,
    required this.isVersionMismatch,
    required this.versionMismatchErrorMessage,
  });

  ServerInfoState copyWith({
    ServerVersionResponseDto? serverVersion,
    ServerFeaturesDto? serverFeatures,
    ServerConfigDto? serverConfig,
    bool? isVersionMismatch,
    String? versionMismatchErrorMessage,
  }) {
    return ServerInfoState(
      serverVersion: serverVersion ?? this.serverVersion,
      serverFeatures: serverFeatures ?? this.serverFeatures,
      serverConfig: serverConfig ?? this.serverConfig,
      isVersionMismatch: isVersionMismatch ?? this.isVersionMismatch,
      versionMismatchErrorMessage:
          versionMismatchErrorMessage ?? this.versionMismatchErrorMessage,
    );
  }

  @override
  String toString() {
    return 'ServerInfoState( serverVersion: $serverVersion, serverFeatures: $serverFeatures, serverConfig: $serverConfig, isVersionMismatch: $isVersionMismatch, versionMismatchErrorMessage: $versionMismatchErrorMessage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfoState &&
        other.serverVersion == serverVersion &&
        other.serverFeatures == serverFeatures &&
        other.serverConfig == serverConfig &&
        other.isVersionMismatch == isVersionMismatch &&
        other.versionMismatchErrorMessage == versionMismatchErrorMessage;
  }

  @override
  int get hashCode {
    return serverVersion.hashCode ^
        serverFeatures.hashCode ^
        serverConfig.hashCode ^
        isVersionMismatch.hashCode ^
        versionMismatchErrorMessage.hashCode;
  }
}
