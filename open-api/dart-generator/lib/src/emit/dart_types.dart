/// Maps an IR [TypeModel] to its Dart type expression as a string.
///
/// This is the single source of truth for how IR types surface in Dart code
/// (field declarations, parameter types, generic arguments). It assumes
/// name resolution has already run, so every [RefType] / [NamedType] carries
/// its resolved `dartName`.
library;

import '../ir/types.dart';

/// The Dart type expression for [t], appending `?` when [nullable].
///
/// Examples: `List<AssetResponseDto>`, `Set<String>`, `Map<String, dynamic>`,
/// `DateTime?`, `int`, `Object?`.
///
/// The body is an exhaustive `switch` over the sealed [TypeModel] hierarchy
/// with no `default` clause, so adding a new IR variant is a compile error
/// here until it is handled.
String dartType(TypeModel t, {required bool nullable}) =>
    _suffix(_bare(t), nullable);

/// The Dart core/class name for [t] without any nullability suffix.
String _bare(TypeModel t) {
  switch (t) {
    case PrimitiveType():
      return _primitive(t.primitive);
    case EnumType():
      return t.meta.dartName;
    case ObjectType():
      return t.meta.dartName;
    case UnionType():
      return t.meta.dartName;
    case AliasType():
      return t.meta.dartName;
    case RefType():
      // resolveNames fills dartName; fall back to the spec name defensively so
      // a missing resolution surfaces as a compile error in the output rather
      // than a crash here.
      return t.dartName ?? t.specName;
    case ArrayType():
      final inner = dartType(t.items, nullable: t.itemsNullable);
      return t.unique ? 'Set<$inner>' : 'List<$inner>';
    case MapType():
      if (t.valueType == null) return 'Map<String, dynamic>';
      final value = dartType(t.valueType!, nullable: t.valueNullable);
      return 'Map<String, $value>';
    case BinaryType():
      return switch (t.role) {
        BinaryRole.upload => 'MultipartFile',
        BinaryRole.download => 'Uint8List',
      };
    case FreeFormType():
      return 'Object';
    case UnknownType():
      return 'Object';
  }
}

String _primitive(PrimitiveKind kind) => switch (kind) {
      PrimitiveKind.string => 'String',
      PrimitiveKind.integer => 'int',
      PrimitiveKind.float => 'double',
      PrimitiveKind.number => 'num',
      PrimitiveKind.boolean => 'bool',
      PrimitiveKind.dateTime => 'DateTime',
      PrimitiveKind.date => 'DateTime',
      PrimitiveKind.object => 'Object',
    };

/// Append `?` to [bare] when [nullable], avoiding a double `??`.
String _suffix(String bare, bool nullable) {
  if (!nullable) return bare;
  return bare.endsWith('?') ? bare : '$bare?';
}
