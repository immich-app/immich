import 'package:immich_mobile/domain/models/value_codec.dart';
import 'package:immich_mobile/utils/option.dart';

enum SessionKey<T> {
  serverUrl<String?>(),
  accessToken<String?>(),
  serverEndpoint<String?>();

  ValueCodec<T> get _codec => ValueCodec.forType(T);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw);
}

const defaultSession = Session();

class Session {
  final String? serverUrl;
  final String? accessToken;
  final String? serverEndpoint;

  const Session({this.serverUrl, this.accessToken, this.serverEndpoint});

  Session copyWith({Option<String>? serverUrl, Option<String>? accessToken, Option<String>? serverEndpoint}) => .new(
    serverUrl: serverUrl.patch(this.serverUrl),
    accessToken: accessToken.patch(this.accessToken),
    serverEndpoint: serverEndpoint.patch(this.serverEndpoint),
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Session &&
          other.serverUrl == serverUrl &&
          other.accessToken == accessToken &&
          other.serverEndpoint == serverEndpoint);

  @override
  int get hashCode => Object.hash(serverUrl, accessToken, serverEndpoint);

  @override
  String toString() => 'Session(serverUrl: $serverUrl, accessToken: $accessToken, serverEndpoint: $serverEndpoint)';

  T read<T>(SessionKey<T> key) =>
      (switch (key) {
            .serverUrl => serverUrl,
            .accessToken => accessToken,
            .serverEndpoint => serverEndpoint,
          })
          as T;

  factory Session.fromEntries(Map<SessionKey, Object?> overrides) =>
      overrides.entries.fold(const Session(), (session, entry) => session.write(entry.key, entry.value));

  Session write<T, U extends T>(SessionKey<T> key, U value) {
    return switch (key) {
      .serverUrl => copyWith(serverUrl: .fromNullable(value as String?)),
      .accessToken => copyWith(accessToken: .fromNullable(value as String?)),
      .serverEndpoint => copyWith(serverEndpoint: .fromNullable(value as String?)),
    };
  }
}
