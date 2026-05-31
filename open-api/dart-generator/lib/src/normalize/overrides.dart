/// The forced-type override table.
///
/// A handful of spec schemas have a typed shape the generator cannot emit
/// usefully. Rather than smear special cases across the schema walker, every
/// such case is declared here, keyed by `(specName, propertyName)`, and applied
/// by the walker as it builds each [Property].
///
/// Today the only entry is `AssetEditActionItemDto.parameters` (DESIGN §5.3):
/// its `anyOf` of crop/rotate/mirror parameter DTOs is unusable for the mobile
/// app, so the property is forced to a raw `Map<String, dynamic>` with
/// passthrough (de)serialization via [ForcedRaw.freeform]. The union type
/// itself is still emitted; only this field opts out of it.
library;

import '../ir/types.dart';

/// A `(specName, propName)` key into the override table.
typedef _OverrideKey = (String specName, String propName);

const Map<_OverrideKey, ForcedRaw> _forcedRaw = {
  ('AssetEditActionItemDto', 'parameters'): ForcedRaw.freeform,
  ('AssetEditActionItemResponseDto', 'parameters'): ForcedRaw.freeform,
};

/// The forced-raw override for `propName` on schema `specName`, or null when
/// the property has no override and should be normalized normally.
ForcedRaw? forcedRawFor(String specName, String propName) =>
    _forcedRaw[(specName, propName)];
