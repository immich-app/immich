import 'package:immich_mobile/domain/models/metadata_value.dart';

class SystemMetadata implements MetadataValue {
  static const String name = 'system-metadata';

  const SystemMetadata();

  factory SystemMetadata.fromJson(Map<String, Object?> json) => const SystemMetadata();

  @override
  Map<String, Object?> toJson() => const {};

  SystemMetadata copyWith() => this;

  @override
  bool operator ==(Object other) => other is SystemMetadata;

  @override
  int get hashCode => 0;

  @override
  String toString() => '$name: {}';
}
