import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/value_codec.dart';

part 'session.model.freezed.dart';

enum SessionKey<T> {
  serverUrl<String?>(),
  accessToken<String?>(),
  serverEndpoint<String?>();

  ValueCodec<T> get _codec => ValueCodec.forType(T);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw);
}

typedef AuthSession = ({String serverUrl, String accessToken, String serverEndpoint});

const defaultSession = Session();

@freezed
abstract class Session with _$Session {
  const Session._();

  const factory Session({String? serverUrl, String? accessToken, String? serverEndpoint}) = _Session;

  factory Session.fromEntries(Map<SessionKey, Object?> overrides) =>
      overrides.entries.fold(const Session(), (session, entry) => session.write(entry.key, entry.value));

  T read<T>(SessionKey<T> key) =>
      (switch (key) {
            .serverUrl => serverUrl,
            .accessToken => accessToken,
            .serverEndpoint => serverEndpoint,
          })
          as T;

  Session write<T, U extends T>(SessionKey<T> key, U value) {
    return switch (key) {
      .serverUrl => copyWith(serverUrl: value as String?),
      .accessToken => copyWith(accessToken: value as String?),
      .serverEndpoint => copyWith(serverEndpoint: value as String?),
    };
  }

  AuthSession? get authSession => switch (this) {
    Session(:final serverUrl?, :final accessToken?, :final serverEndpoint?) => (
      serverUrl: serverUrl,
      accessToken: accessToken,
      serverEndpoint: serverEndpoint,
    ),
    _ => null,
  };
}
