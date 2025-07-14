// ignore_for_file: implementation_imports

import 'package:easy_localization/src/easy_localization_controller.dart';
import 'package:easy_localization/src/localization.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';

/// Workaround to manually load translations in another Isolate
Future<bool> loadTranslations() async {
  await EasyLocalizationController.initEasyLocation();

  final controller = EasyLocalizationController(
    supportedLocales: locales.values.toList(),
    useFallbackTranslations: true,
    saveLocale: true,
    assetLoader: const CodegenLoader(),
    path: translationsPath,
    useOnlyLangCode: false,
    onLoadError: (e) => debugPrint(e.toString()),
    fallbackLocale: locales.values.first,
  );

  await controller.loadTranslations();

  return Localization.load(
    controller.locale,
    translations: controller.translations,
    fallbackTranslations: controller.fallbackTranslations,
  );
}
