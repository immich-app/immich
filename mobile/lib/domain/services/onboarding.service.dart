import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';

class OnboardingService {
  final SettingsRepository _settingsRepository;

  const OnboardingService(this._settingsRepository);

  bool get isComplete => _settingsRepository.appConfig.onboardingComplete;

  Future<void> markComplete([bool complete = true]) => _settingsRepository.write(.onboardingComplete, complete);
}
