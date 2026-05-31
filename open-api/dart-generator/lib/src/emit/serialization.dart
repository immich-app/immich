/// The shared (de)serialization core.
///
/// Two pure functions turn an IR [TypeModel] into Dart *expression strings*:
///
///   * [readExpr]  — decoded JSON value  → Dart-typed value (`fromJson` side).
///   * [writeExpr] — Dart-typed value    → JSON-encodable value (`toJson` side).
///
/// They return strings (not `code_builder` `Expression`s) so emitters can drop
/// them straight into `Code('...')` method bodies, which is how `code_builder`
/// models statements. Both are total over the sealed [TypeModel] hierarchy.
///
/// ## Contract for downstream emitters
///
/// ### readExpr(t, jsonAccess, {nullable, def})
/// Produces an expression that converts `jsonAccess` (e.g. `json[r'foo']`,
/// already a `dynamic` decoded from JSON) into a value assignable to the Dart
/// type `dartType(t, nullable: nullable)`.
///
///   * When `nullable == false` the expression force-unwraps with `!` (the
///     field is required-and-non-null per the tri-state matrix). The caller is
///     responsible for only passing `nullable: false` where the matrix says the
///     value is present.
///   * When `def != null` a `?? <default>` tail is appended. This is meant for
///     the *optional-without-default-is-nullable-false* matrix row
///     (`required: false, nullable: false`): the read is done in nullable form
///     then defaulted. Do NOT also pass `nullable: false` in that case — pass
///     `nullable: true` (so no premature `!`) together with `def`.
///   * Doubles read `(x as num).toDouble()`; bare ambiguous `number` uses the
///     same path (its [PrimitiveType.primitive] is already `float`).
///   * `DateTime` uses `DateTime.parse(...)`.
///   * Enums/refs/unions/aliases call `Type.fromJson(...)` (itself nullable).
///   * Arrays map their items and collect with `.toList(growable: false)` or
///     `.toSet()`; inner-nullable items propagate.
///   * Free-form / untyped maps use `(x as Map?)?.cast<String, dynamic>()`.
///
/// ### writeExpr(t, dartAccess, {nullable})
/// Produces the *value side* of a JSON assignment for `dartAccess`. It NEVER
/// emits `if (x != null)` guards — the model emitter wraps nullable fields so
/// that nulls are omitted from the JSON map (never `json[k] = null`). When
/// `nullable == true` the expression is null-safe (`?.` / null-aware) so it is
/// also valid if the emitter chooses to evaluate it unguarded.
library;

import '../ir/types.dart';
import '../util/naming.dart';

// ───────────────────────────── read (fromJson) ─────────────────────────────

/// See the library-level contract. Returns a Dart expression string.
String readExpr(
  TypeModel t,
  String jsonAccess, {
  required bool nullable,
  DefaultValue? def,
}) {
  // A NullDefault adds nothing (`x ?? null` ≡ `x`), so treat it as no default.
  final hasDefault = def != null && def is! NullDefault;

  // Required & non-null. Primitives read as a direct cast (`json[k] as String`,
  // `(json[k] as num).toDouble()`); other types force-unwrap their nullable
  // `fromJson`/cast core (parenthesized so `!` binds to the whole expression).
  if (!nullable && !hasDefault) {
    if (t is PrimitiveType) return _readPrimitiveNonNull(t.primitive, jsonAccess);
    return '${_paren(_readCore(t, jsonAccess, nullable: false))}!';
  }

  // Nullable, or optional-with-default. _readCore yields a nullable (T?)
  // expression; append `?? <default>` only for a real (non-null) default.
  final core = _readCore(t, jsonAccess, nullable: nullable);
  return hasDefault ? '$core ?? ${_defaultLiteral(def)}' : core;
}

/// The conversion expression as a nullable (`T?`) value.
///
/// Every branch tolerates a null/absent `src` and yields `T?`; [readExpr] adds
/// the `!`/`?? default` tail. Compound expressions return already-parenthesized
/// so they compose safely under a trailing `!`.
String _readCore(TypeModel t, String src, {required bool nullable}) {
  switch (t) {
    case PrimitiveType():
      return _readPrimitive(t.primitive, src);
    case EnumType():
      return '${t.meta.dartName}.fromJson($src)';
    case ObjectType():
      return '${t.meta.dartName}.fromJson($src)';
    case UnionType():
      return '${t.meta.dartName}.fromJson($src)';
    case AliasType():
      return '${t.meta.dartName}.fromJson($src)';
    case RefType():
      return '${t.dartName ?? t.specName}.fromJson($src)';
    case ArrayType():
      return _readArray(t, src);
    case MapType():
      return _readMap(t, src);
    case BinaryType():
      // Binary values are not read from a JSON map; downloads are handled at
      // the operation site as raw bytes. Defensive passthrough.
      return switch (t.role) {
        BinaryRole.download => '($src as Uint8List?)',
        BinaryRole.upload => '($src as MultipartFile?)',
      };
    case FreeFormType():
      return src;
    case UnknownType():
      return src;
  }
}

String _readPrimitive(PrimitiveKind kind, String src) => switch (kind) {
      PrimitiveKind.string => '($src as String?)',
      PrimitiveKind.integer => '($src as int?)',
      // Coerce through num so an integer wire value widens to double.
      PrimitiveKind.float => '($src as num?)?.toDouble()',
      PrimitiveKind.number => '($src as num?)',
      PrimitiveKind.boolean => '($src as bool?)',
      PrimitiveKind.dateTime => '($src == null ? null : DateTime.parse($src as String))',
      PrimitiveKind.date => '($src == null ? null : DateTime.parse($src as String))',
      PrimitiveKind.object => src,
    };

/// The required, non-null primitive read — a direct cast/parse with no `?`/`!`
/// noise. Doubles still coerce through `num` so integer wire values widen.
String _readPrimitiveNonNull(PrimitiveKind kind, String src) => switch (kind) {
      PrimitiveKind.string => '$src as String',
      PrimitiveKind.integer => '$src as int',
      PrimitiveKind.float => '($src as num).toDouble()',
      PrimitiveKind.number => '$src as num',
      PrimitiveKind.boolean => '$src as bool',
      PrimitiveKind.dateTime => 'DateTime.parse($src as String)',
      PrimitiveKind.date => 'DateTime.parse($src as String)',
      PrimitiveKind.object => '$src as Object',
    };

/// Wrap [expr] in parentheses unless it is already a single parenthesized group
/// or a bare identifier/access (no top-level operators that `!` would mis-bind).
String _paren(String expr) {
  if (expr.startsWith('(') && _isBalancedGroup(expr)) return expr;
  return '($expr)';
}

/// True when [expr] is a single parenthesized group, i.e. the opening `(`
/// matches the final `)` and the string ends there.
bool _isBalancedGroup(String expr) {
  if (!expr.startsWith('(') || !expr.endsWith(')')) return false;
  var depth = 0;
  for (var i = 0; i < expr.length; i++) {
    final c = expr[i];
    if (c == '(') {
      depth++;
    } else if (c == ')') {
      depth--;
      if (depth == 0) return i == expr.length - 1;
    }
  }
  return false;
}

String _readArray(ArrayType t, String src) {
  final element = '\$e';
  final itemRead = readExpr(t.items, element, nullable: t.itemsNullable);
  final collect = t.unique ? '.toSet()' : '.toList(growable: false)';
  // `(src as List?)?.map((e) => <itemRead>)<collect>`
  return '($src as List?)?.map(($element) => $itemRead)$collect';
}

String _readMap(MapType t, String src) {
  if (t.valueType == null) {
    return '($src as Map?)?.cast<String, dynamic>()';
  }
  final value = readExpr(t.valueType!, r'$v', nullable: t.valueNullable);
  // Rebuild the map so each value is converted.
  return '($src as Map?)?.map((k, \$v) => MapEntry(k as String, $value))';
}

String _defaultLiteral(DefaultValue def) {
  switch (def) {
    case NullDefault():
      return 'null';
    case BoolDefault():
      return def.value ? 'true' : 'false';
    case NumberDefault():
      return def.value.toString();
    case StringDefault():
      return _stringLiteral(def.value);
    case EnumDefault():
      // Reference the const enum member directly (e.g. `AssetOrder.desc`),
      // matching the constructor default emitted by the model — not the
      // non-const `fromJson(wire)!`. Same sanitizer resolveNames uses.
      final type = def.enumRef.dartName ?? def.enumRef.specName;
      return '$type.${sanitizeEnumMember(def.enumMemberWire)}';
  }
}

// ───────────────────────────── write (toJson) ──────────────────────────────

/// See the library-level contract. Returns the JSON value-side expression.
String writeExpr(TypeModel t, String dartAccess, {required bool nullable}) {
  switch (t) {
    case PrimitiveType():
      return _writePrimitive(t.primitive, dartAccess, nullable: nullable);
    case EnumType():
      return _nullAware(dartAccess, '.toJson()', nullable);
    case ObjectType():
      return _nullAware(dartAccess, '.toJson()', nullable);
    case UnionType():
      return _nullAware(dartAccess, '.toJson()', nullable);
    case AliasType():
      return _nullAware(dartAccess, '.toJson()', nullable);
    case RefType():
      return _nullAware(dartAccess, '.toJson()', nullable);
    case ArrayType():
      return _writeArray(t, dartAccess, nullable: nullable);
    case MapType():
      return _writeMap(t, dartAccess, nullable: nullable);
    case BinaryType():
      return dartAccess;
    case FreeFormType():
      return dartAccess;
    case UnknownType():
      return dartAccess;
  }
}

String _writePrimitive(PrimitiveKind kind, String access, {required bool nullable}) {
  switch (kind) {
    case PrimitiveKind.dateTime:
    case PrimitiveKind.date:
      // UTC-normalized ISO-8601 matches the wire format the server emits and
      // keeps round-trips stable across time zones.
      return _nullAware(access, '.toUtc().toIso8601String()', nullable);
    case PrimitiveKind.string:
    case PrimitiveKind.integer:
    case PrimitiveKind.float:
    case PrimitiveKind.number:
    case PrimitiveKind.boolean:
    case PrimitiveKind.object:
      return access;
  }
}

String _writeArray(ArrayType t, String access, {required bool nullable}) {
  final itemWrite = writeExpr(t.items, r'$e', nullable: t.itemsNullable);
  // When item serialization is identity, the collection itself is already
  // JSON-encodable (e.g. List<String>); emit it directly to avoid a no-op map.
  if (itemWrite == r'$e') {
    if (t.unique) {
      return nullable ? '$access?.toList(growable: false)' : '$access.toList(growable: false)';
    }
    return access;
  }
  final mapAndCollect = '.map((\$e) => $itemWrite).toList(growable: false)';
  return _nullAware(access, mapAndCollect, nullable);
}

String _writeMap(MapType t, String access, {required bool nullable}) {
  if (t.valueType == null) return access;
  final valueWrite = writeExpr(t.valueType!, r'$v', nullable: t.valueNullable);
  if (valueWrite == r'$v') return access;
  final transform = '.map((k, \$v) => MapEntry(k, $valueWrite))';
  return _nullAware(access, transform, nullable);
}

/// `access<op>` when non-null; null-aware (`?.`) form when [nullable].
///
/// [op] always begins with `.` (a member access like `.toJson()`), so the
/// null-aware form inserts a `?` before it: `access?.toJson()`.
String _nullAware(String access, String op, bool nullable) {
  if (!nullable) return '$access$op';
  return '$access?$op';
}

// ───────────────────────────── literals ────────────────────────────────────

/// A raw single-quoted Dart string literal. The generator's identifiers and
/// wire values never contain single quotes or backslashes, so a raw literal is
/// safe and matches the `r'...'` style used throughout the emitted client.
String _stringLiteral(String value) => "r'$value'";
