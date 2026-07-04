import 'ffi/bindings.g.dart' as bindings;
import 'ffi/ffi.dart';

/// Version baked into the native core. Cheap — fine on the main isolate.
String coreVersion() =>
    readAndFree(bindings.immich_core_version(), 'core_version');
