import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_settings.provider.g.dart';

@Riverpod(keepAlive: true)
AppSettingsService appSettingsService(AppSettingsServiceRef ref) =>
    AppSettingsService();
