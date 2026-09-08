#import "GeneratedPluginRegistrant.h"
#include "../../../native/crates/immich_core_ffi/include/immich_core.h"

// cbindgen gives the enum tag and its int typedef the same name, so Swift needs a name for the tag.
// The function pointer type comes from the declaration, so nothing is retyped here.
typedef enum ImmichCoreLogLevel ImmichCoreLevel;
typedef __typeof__(&immich_core_log) ImmichCoreLogFn;
