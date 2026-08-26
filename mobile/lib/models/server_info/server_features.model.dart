// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'server_features.model.freezed.dart';

@freezed
class const ServerFeatures({
  required final bool trash,
  required final bool map,
  required final bool oauthEnabled,
  required final bool passwordLogin,
  final bool ocr = false,
  final bool smartSearch = false,
}) with _$ServerFeatures {
  factory ServerFeatures.fromDto(ServerFeaturesDto dto) => ServerFeatures(
    trash: dto.trash,
    map: dto.map,
    oauthEnabled: dto.oauth,
    passwordLogin: dto.passwordLogin,
    ocr: dto.ocr,
    smartSearch: dto.smartSearch,
  );
}
