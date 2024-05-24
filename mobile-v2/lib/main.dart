import 'package:flutter/material.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/immich_app.dart';
import 'package:immich_mobile/service_locator.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // DI Injection
  ServiceLocator.configureServices();
  // Init localization
  LocaleSettings.useDeviceLocale();

  runApp(const ImmichApp());
}
