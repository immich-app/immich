import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';

final settingsProvider = Provider.autoDispose<SettingsRepository>((_) => SettingsRepository.instance);

final appConfigProvider = Provider.autoDispose<AppConfig>((ref) {
  final repo = ref.watch(settingsProvider);
  final subscription = repo.watchConfig().listen((event) => ref.state = event);
  ref.onDispose(subscription.cancel);
  return repo.appConfig;
});
