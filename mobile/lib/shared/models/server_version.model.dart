import 'dart:convert';

class ServerVersion {
  final String serverVersion;
  ServerVersion({
    required this.serverVersion,
  });

  ServerVersion copyWith({
    String? serverVersion,
  }) {
    return ServerVersion(
      serverVersion: serverVersion ?? this.serverVersion,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'serverVersion': serverVersion,
    };
  }

  factory ServerVersion.fromMap(Map<String, dynamic> map) {
    return ServerVersion(
      serverVersion: map['serverVersion'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerVersion.fromJson(String source) => ServerVersion.fromMap(json.decode(source));

  @override
  String toString() => 'ServerVersion(serverVersion: $serverVersion)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerVersion && other.serverVersion == serverVersion;
  }

  @override
  int get hashCode => serverVersion.hashCode;
}
