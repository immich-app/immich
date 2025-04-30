import 'package:easy_localization/easy_localization.dart';
import 'package:intl/message_format.dart';

String t(String key, [Map<String, Object>? args]) {
  try {
    String message = key.tr();
    if (args != null) {
      return MessageFormat(message).format(args);
    }
    return message;
  } catch (e) {
    return key;
  }
}
