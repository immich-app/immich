import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'server_features.model.freezed.dart';

@freezed
abstract class ServerFeatures with _$ServerFeatures {
  const factory ServerFeatures({
    required bool trash,
    required bool map,
    required bool oauthEnabled,
    required bool passwordLogin,
    @Default(false) bool ocr,
    @Default(false) bool smartSearch,
  }) = _ServerFeatures;

  factory ServerFeatures.fromDto(ServerFeaturesDto dto) => ServerFeatures(
    trash: dto.trash,
    map: dto.map,
    oauthEnabled: dto.oauth,
    passwordLogin: dto.passwordLogin,
    ocr: dto.ocr,
    smartSearch: dto.smartSearch,
  );
}
