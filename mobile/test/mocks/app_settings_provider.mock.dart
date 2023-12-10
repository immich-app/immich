import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:mocktail/mocktail.dart';

class AppSettingsServiceMock with Mock implements AppSettingsService {}

Override getAppSettingsServiceMock(AppSettingsService service) =>
    appSettingsServiceProvider.overrideWith((ref) => service);
