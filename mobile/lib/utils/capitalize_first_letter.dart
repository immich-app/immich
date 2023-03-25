import 'package:easy_localization/easy_localization.dart';

extension StringExtension on String {
  String capitalizeFirstLetter() {
    return "${this[0].toUpperCase()}${substring(1).toLowerCase()}";
  }

  String capitalizeWords() {
    return split(' ')
        .map((s) => toBeginningOfSentenceCase(s))
        .join(' ');
  }
}
