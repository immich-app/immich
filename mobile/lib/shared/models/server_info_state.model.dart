import 'package:openapi/api.dart';

class ServerInfoState {
  final ServerVersionReponseDto serverVersion;
  final bool isVersionMismatch;
  final String versionMismatchErrorMessage;

  ServerInfoState({
    required this.serverVersion,
    required this.isVersionMismatch,
    required this.versionMismatchErrorMessage,
  });

  ServerInfoState copyWith({
    ServerVersionReponseDto? serverVersion,
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
