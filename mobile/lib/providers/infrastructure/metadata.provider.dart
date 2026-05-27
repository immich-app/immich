import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';

final metadataProvider = Provider.autoDispose<MetadataRepository>((_) => MetadataRepository.instance);

final appConfigProvider = Provider.autoDispose<AppConfig>((ref) {
  final repo = ref.watch(metadataProvider);
  final subscription = repo.watchConfig().listen((event) => ref.state = event);
  ref.onDispose(subscription.cancel);
  return repo.appConfig;
});
