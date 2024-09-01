import 'package:flutter/material.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/immich_app.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/log_manager.dart';
// ignore: depend_on_referenced_packages
import 'package:stack_trace/stack_trace.dart' as stack_trace;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // DI Injection
  ServiceLocator.configureServices();
  // Init logging
  LogManager.I.init();
  // Init localization
  LocaleSettings.useDeviceLocale();

  FlutterError.demangleStackTrace = (StackTrace stack) {
    if (stack is stack_trace.Trace) return stack.vmTrace;
    if (stack is stack_trace.Chain) return stack.toTrace().vmTrace;
    return stack;
  };

  runApp(const ImmichApp());
}
