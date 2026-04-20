import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_stub.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';

ViewIntentHandler createViewIntentHandler(Ref ref) => const StubViewIntentHandler();

