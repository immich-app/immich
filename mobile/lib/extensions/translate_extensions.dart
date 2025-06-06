import 'package:easy_localization/easy_localization.dart';
import 'package:intl/message_format.dart';
import 'package:flutter/material.dart';

extension StringTranslateExtension on String {
  String t({BuildContext? context, Map<String, Object>? args}) {
    return _translateHelper(context, this, args);
  }
}

extension TextTranslateExtension on Text {
  Text t({BuildContext? context, Map<String, Object>? args}) {
    return Text(
      _translateHelper(context, data ?? '', args),
      key: key,
      style: style,
      strutStyle: strutStyle,
      textAlign: textAlign,
      textDirection: textDirection,
      locale: locale,
      softWrap: softWrap,
      overflow: overflow,
      textScaler: textScaler,
      maxLines: maxLines,
      semanticsLabel: semanticsLabel,
      textWidthBasis: textWidthBasis,
      textHeightBehavior: textHeightBehavior,
    );
  }
}

String _translateHelper(
  BuildContext? context,
  String key, [
  Map<String, Object>? args,
]) {
  if (key.isEmpty) {
    return '';
  }
  try {
    final translatedMessage = context != null ? context.tr(key) : key.tr();
    return args != null
        ? MessageFormat(translatedMessage, locale: Intl.defaultLocale ?? 'en')
            .format(args)
        : translatedMessage;
  } catch (e) {
    debugPrint('Translation failed for key "$key". Error: $e');
    return key;
  }
}
