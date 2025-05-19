import 'package:http/http.dart';

extension LoggerExtension on Response {
  String toLoggerString() => "Status: $statusCode $reasonPhrase\n\n$body";
}
