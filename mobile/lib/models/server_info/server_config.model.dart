// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'server_config.model.freezed.dart';

@freezed
class const ServerConfig({
  required final int trashDays,
  required final String oauthButtonText,
  required final String externalDomain,
  required final String mapDarkStyleUrl,
  required final String mapLightStyleUrl,
}) with _$ServerConfig {
  factory ServerConfig.fromDto(ServerConfigDto dto) => ServerConfig(
    trashDays: dto.trashDays,
    oauthButtonText: dto.oauthButtonText,
    externalDomain: dto.externalDomain,
    mapDarkStyleUrl: dto.mapDarkStyleUrl,
    mapLightStyleUrl: dto.mapLightStyleUrl,
  );
}
