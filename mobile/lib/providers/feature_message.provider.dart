import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/feature_message.service.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

final featureMessageServiceProvider = Provider<FeatureMessageService>(
  (ref) => FeatureMessageService(ref.read(settingsProvider)),
);

final featureMessageCheckedProvider = StateProvider<bool>((ref) => false);
