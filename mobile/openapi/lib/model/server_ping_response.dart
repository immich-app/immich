// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerPingResponse {
  const ServerPingResponse({required this.res});

  final String res;

  static ServerPingResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerPingResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(res: json[r'res'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'res'] = res;
    return json;
  }

  ServerPingResponse copyWith({String? res}) {
    return .new(res: res ?? this.res);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is ServerPingResponse && res == other.res);
  }

  @override
  int get hashCode {
    return Object.hashAll([res]);
  }

  @override
  String toString() => 'ServerPingResponse(res=$res)';
}
