import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/feature_message.service.dart';
import 'package:immich_mobile/domain/services/onboarding.service.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

final featureMessageServiceProvider = Provider<FeatureMessageService>(
  (ref) => FeatureMessageService(ref.watch(settingsProvider)),
);

final onboardingServiceProvider = Provider<OnboardingService>((ref) => OnboardingService(ref.watch(settingsProvider)));
