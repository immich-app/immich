import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';

void main() {
  const englishMapDisclosure =
      'Noodle Gallery uses your precise current location to center the map and show photos and videos from your current area. Your precise device location is not stored or shared. Do you want to allow location access now?';
  const englishMapServiceDisclosure =
      'Noodle Gallery uses your precise current location to center the map and show photos and videos from your current area. Location services must be enabled before Noodle Gallery can access this location. Your precise device location is not stored or shared. Do you want to open location settings now?';
  const englishForegroundDisclosure =
      'Android requires precise location permission so Noodle Gallery can read the current Wi-Fi network name for automatic server switching. The Wi-Fi network name is saved on this device for matching, and your precise device location is not stored or shared.';
  const englishBackgroundDisclosure =
      'Noodle Gallery uses background location permission to keep reading the Wi-Fi network name while automatic server switching runs in the background. The Wi-Fi network name is saved on this device for matching, and your precise device location is not stored or shared.';

  Map<String, dynamic> loadTranslations(String path) {
    final file = File(path);
    return jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  }

  Iterable<MapEntry<String, Map<String, dynamic>>> loadAllTranslationFiles() {
    return Directory('../i18n')
        .listSync()
        .whereType<File>()
        .where((file) => file.path.endsWith('.json'))
        .map((file) => MapEntry(file.path, loadTranslations(file.path)));
  }

  bool isEnglishSource(String source) =>
      source.endsWith('/en.json') || source.contains('overrides-en.json') || source.startsWith('CodegenLoader.en');

  void expectBranding(String source, String content) {
    expect(content, contains('Noodle Gallery'), reason: source);
    expect(content, isNot(contains('Immich')), reason: source);
  }

  void expectMapDisclosure(String source, String content) {
    expectBranding(source, content);
    if (isEnglishSource(source)) {
      expect(content, contains('precise current location'), reason: source);
      expect(content, contains('center the map'), reason: source);
      expect(content, contains('current area'), reason: source);
      expect(content, contains('precise device location is not stored or shared'), reason: source);
    } else {
      expect(content, isNot(englishMapDisclosure), reason: source);
    }
  }

  void expectMapServiceDisclosure(String source, String content) {
    expectMapDisclosure(source, content);
    if (isEnglishSource(source)) {
      expect(content, contains('Location services must be enabled'), reason: source);
      expect(content, contains('open location settings'), reason: source);
    } else {
      expect(content, isNot(englishMapServiceDisclosure), reason: source);
    }
  }

  void expectAutomaticEndpointDisclosures(String source, Map<String, dynamic> translations) {
    if (translations case {'location_permission_content': final String foreground}) {
      expectBranding(source, foreground);
      if (isEnglishSource(source)) {
        expect(foreground, contains('precise location'), reason: source);
        expect(foreground, contains('Wi-Fi network name'), reason: source);
        expect(foreground, contains('saved on this device for matching'), reason: source);
        expect(foreground, contains('automatic server switching'), reason: source);
        expect(foreground, contains('precise device location is not stored or shared'), reason: source);
      } else {
        expect(foreground, isNot(englishForegroundDisclosure), reason: source);
      }
    }

    if (translations case {'background_location_permission_content': final String background}) {
      expectBranding(source, background);
      if (isEnglishSource(source)) {
        expect(background, contains('background location'), reason: source);
        expect(background, contains('Wi-Fi network name'), reason: source);
        expect(background, contains('saved on this device for matching'), reason: source);
        expect(background, contains('automatic server switching'), reason: source);
        expect(background, contains('precise device location is not stored or shared'), reason: source);
      } else {
        expect(background, isNot(englishBackgroundDisclosure), reason: source);
      }
    }
  }

  test('map disclosures explain precise current location usage', () {
    for (final MapEntry(key: source, value: translations) in loadAllTranslationFiles()) {
      if (translations case {'map_no_location_permission_content': final String content}) {
        expectMapDisclosure(source, content);
      }
      if (translations case {'map_location_service_disabled_content': final String content}) {
        expectMapServiceDisclosure(source, content);
      }
    }
  });

  test('generated runtime map disclosures match policy requirements', () {
    for (final MapEntry(key: locale, value: translations) in CodegenLoader.mapLocales.entries) {
      if (translations case {'map_no_location_permission_content': final String content}) {
        expectMapDisclosure('CodegenLoader.$locale.map_no_location_permission_content', content);
      }
      if (translations case {'map_location_service_disabled_content': final String content}) {
        expectMapServiceDisclosure('CodegenLoader.$locale.map_location_service_disabled_content', content);
      }
    }
  });

  test('automatic endpoint disclosures explain Wi-Fi location permission usage', () {
    final translationMaps = [
      ...loadAllTranslationFiles(),
      MapEntry('../branding/i18n/overrides-en.json', loadTranslations('../branding/i18n/overrides-en.json')),
    ];

    for (final MapEntry(key: source, value: translations) in translationMaps) {
      expectAutomaticEndpointDisclosures(source, translations);
    }
  });

  test('generated runtime automatic endpoint disclosures match policy requirements', () {
    for (final MapEntry(key: locale, value: translations) in CodegenLoader.mapLocales.entries) {
      expectAutomaticEndpointDisclosures('CodegenLoader.$locale', translations);
    }
  });
}
