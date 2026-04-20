import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_factory_stub.dart'
    if (dart.library.io) 'view_intent_handler_factory_io.dart' as impl;

ViewIntentHandler createViewIntentHandler(Ref ref) => impl.createViewIntentHandler(ref);

