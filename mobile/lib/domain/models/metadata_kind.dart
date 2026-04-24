import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/metadata/system_metadata.dart';
import 'package:immich_mobile/domain/models/metadata_value.dart';

enum MetadataKind<T extends MetadataValue> {
  appConfig<AppConfig>(AppConfig.name, AppConfig.fromJson, AppConfig()),
  systemConfig<SystemConfig>(SystemConfig.name, SystemConfig.fromJson, SystemConfig()),
  systemMetadata<SystemMetadata>(SystemMetadata.name, SystemMetadata.fromJson, SystemMetadata());

  final String key;
  final T Function(Map<String, Object?>) fromJson;
  final T defaultValue;

  const MetadataKind(this.key, this.fromJson, this.defaultValue);
}
