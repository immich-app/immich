import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';

final playOriginalVideoOverrideProvider = StateProvider.autoDispose.family<bool?, String>((ref, assetId) => null);

final effectivePlayOriginalVideoProvider = Provider.autoDispose.family<bool, String>((ref, assetId) {
  final override = ref.watch(playOriginalVideoOverrideProvider(assetId));
  if (override != null) {
    return override;
  }
  return ref.watch(settingsProvider.notifier).get<bool>(Setting.loadOriginalVideo);
});
