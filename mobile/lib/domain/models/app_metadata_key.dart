import 'package:immich_mobile/domain/models/value_codec.dart';

const int kCurrentVersion = 29;

enum AppMetadataKey<T> {
  version<int>(kCurrentVersion),
  syncMigrationStatus<List<String>>([], codec: ListCodec(PrimitiveCodec.string)),
  manageLocalMediaAndroid<bool>(false);

  const AppMetadataKey(this.defaultValue, {ValueCodec<T>? codec}) : _codecOverride = codec;

  final T defaultValue;

  final ValueCodec<T>? _codecOverride;
  ValueCodec<T> get _codec => _codecOverride ?? ValueCodec.forType(T);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw);
}
