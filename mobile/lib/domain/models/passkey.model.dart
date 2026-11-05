import 'package:freezed_annotation/freezed_annotation.dart';

part 'passkey.model.freezed.dart';

@freezed
abstract class Passkey with _$Passkey {
  const factory Passkey({required String id, required DateTime createdAt, String? name, DateTime? usedAt}) = _Passkey;
}
