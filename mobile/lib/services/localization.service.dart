// ignore_for_file: implementation_imports
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:easy_localization/src/easy_localization_controller.dart';
import 'package:easy_localization/src/localization.dart';

import 'package:intl/message_format.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';

abstract class ILocalizationService {
  String translate(String key, [Map<String, Object>? args]);

  Locale get currentLocale;

  bool get isInitialized;

  Future<bool> loadTranslations();

  Future<void> changeLocale(Locale localeCode);
}

class EasyLocalizationService implements ILocalizationService {
  EasyLocalizationService._internal();

  static EasyLocalizationService? _instance;
  static EasyLocalizationService get instance {
    _instance ??= EasyLocalizationService._internal();
    return _instance!;
  }

  factory EasyLocalizationService() => instance;

  static BuildContext? _context;
  static EasyLocalizationController? _controller;
  static bool _isInitialized = false;

  static void setContext(BuildContext context) {
    if (_context != context) {
      debugPrint('🔄 Updating EasyLocalization context');
      _context = context;
    }
  }

  static BuildContext? get context => _context;

  @override
  String translate(String key, [Map<String, Object>? args]) {
    if (_context != null) {
      try {
        String message = _context!.tr(key);
        if (args != null) {
          return MessageFormat(message, locale: Intl.defaultLocale ?? 'en')
              .format(args);
        }
        return message;
      } catch (e) {
        debugPrint('❌ Translation error for key "$key": $e');
        return key;
      }
    }
    return key;
  }

  @override
  Locale get currentLocale {
    if (_controller != null) {
      return _controller!.locale;
    }
    if (_context != null) {
      return _context!.locale;
    }
    return Intl.defaultLocale != null
        ? Locale(Intl.defaultLocale!)
        : locales.values.first;
  }

  @override
  bool get isInitialized => _isInitialized;

  @override
  Future<void> changeLocale(Locale localeCode) async {
    try {
      if (_context != null) {
        await _context!.setLocale(localeCode);
      }
      if (_controller != null) {
        await _controller!.setLocale(localeCode);
      }
      debugPrint('✅ Locale changed to: $localeCode');
    } catch (e) {
      debugPrint('❌ Failed to change locale to $localeCode: $e');
    }
  }

  @override
  Future<bool> loadTranslations() async {
    if (_isInitialized) {
      debugPrint('✅ Translations already loaded');
      return true;
    }
    try {
      await EasyLocalizationController.initEasyLocation();
      _controller = EasyLocalizationController(
        supportedLocales: locales.values.toList(),
        useFallbackTranslations: true,
        saveLocale: true,
        assetLoader: const CodegenLoader(),
        path: translationsPath,
        useOnlyLangCode: false,
        onLoadError: (e) => debugPrint(e.toString()),
        fallbackLocale: locales.values.first,
      );
      await _controller!.loadTranslations();
      final bool result = Localization.load(
        _controller!.locale,
        translations: _controller!.translations,
        fallbackTranslations: _controller!.fallbackTranslations,
      );
      _isInitialized = result;
      debugPrint('✅ Translations loaded: $result');
      return result;
    } catch (e) {
      debugPrint('❌ Error loading translations: $e');
      return false;
    }
  }
}
