import 'package:immich_mobile/domain/models/feature_message.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';

class FeatureMessageService {
  final SettingsRepository _settingsRepository;

  const FeatureMessageService(this._settingsRepository);

  bool shouldShow() {
    final seen = _settingsRepository.appConfig.read(SettingsKey.featureMessageSeenVersion);
    return featureMessageHighlights.isNotEmpty && featureMessageHighlightVersion > seen;
  }

  Future<void> markSeen() =>
      _settingsRepository.write(SettingsKey.featureMessageSeenVersion, featureMessageHighlightVersion);
}
