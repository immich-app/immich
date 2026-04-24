import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/metadata/system_metadata.dart';
import 'package:immich_mobile/domain/models/metadata_kind.dart';
import 'package:immich_mobile/infrastructure/repositories/cached_metadata.repository.dart';

final metadataProvider = Provider.autoDispose<CachedMetadataRepository>((_) => CachedMetadataRepository.instance);

final appConfigProvider = Provider.autoDispose<AppConfig>((ref) {
  final subscription = ref.watch(metadataProvider).watch(MetadataKind.appConfig).listen((event) {
    ref.state = event;
  });
  ref.onDispose(subscription.cancel);
  return ref.watch(metadataProvider).read(MetadataKind.appConfig);
});

final systemConfigProvider = Provider.autoDispose<SystemConfig>((ref) {
  final subscription = ref.watch(metadataProvider).watch(MetadataKind.systemConfig).listen((event) {
    ref.state = event;
  });
  ref.onDispose(subscription.cancel);
  return ref.watch(metadataProvider).read(MetadataKind.systemConfig);
});

final systemMetadataProvider = Provider.autoDispose<SystemMetadata>((ref) {
  final subscription = ref.watch(metadataProvider).watch(MetadataKind.systemMetadata).listen((event) {
    ref.state = event;
  });
  ref.onDispose(subscription.cancel);
  return ref.watch(metadataProvider).read(MetadataKind.systemMetadata);
});
