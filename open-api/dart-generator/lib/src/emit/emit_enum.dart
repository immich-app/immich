/// Emits an [EnumType] as a modern Dart enhanced `enum`.
///
/// The emitted shape (idiomatic end-state, DESIGN §5.2):
///
/// ```dart
/// enum AssetTypeEnum {
///   image._(r'IMAGE'),
///   video._(r'VIDEO'),
///   /// Reserved for values from newer servers. Never sent by this client.
///   valueUnknown._(r'__unknown__');
///
///   const AssetTypeEnum._(this.value);
///   final String value;
///   static AssetTypeEnum? fromJson(dynamic value) {
///     for (final e in values) {
///       if (e.value == value) return e;
///     }
///     return value == null ? null : valueUnknown;
///   }
///   Object toJson() => value;
///   @override
///   String toString() => value;
/// }
/// ```
///
/// The `valueUnknown` member (emitted only when [GeneratorOptions.tolerantEnums])
/// keeps decoding total: an unrecognized non-null wire value from a newer server
/// maps to it instead of throwing. Integer-backed enums are supported (`final int
/// value;`); none exist in the current spec.
library;

import 'package:code_builder/code_builder.dart';

import '../ir/types.dart';
import 'emit_meta.dart';

/// The sentinel wire value carried by the synthetic `valueUnknown` member.
///
/// Never sent to the server; only the tolerant `fromJson` ever produces this
/// member, and only for unrecognized inbound values.
const String _unknownWire = '__unknown__';

/// The Dart identifier of the tolerant catch-all member.
const String _unknownMember = 'valueUnknown';

/// Builds the enhanced `enum` declaration for [type].
///
/// Respects [options.tolerantEnums]: when false, no `valueUnknown` member is
/// emitted and `fromJson` returns `null` for unrecognized values.
Enum emitEnum(EnumType type, GeneratorOptions options) {
  final isInt = type.backing == EnumBacking.integer;
  final valueType = isInt ? 'int' : 'String';
  final tolerant = options.tolerantEnums;

  return Enum(
    (b) => b
      ..name = type.meta.dartName
      ..docs.addAll(_typeDocs(type))
      ..values.addAll([
        for (final member in type.members) _enumValue(member, isInt),
        if (tolerant) _unknownValue(isInt),
      ])
      ..fields.addAll([
        Field(
          (f) => f
            ..name = 'value'
            ..modifier = FieldModifier.final$
            ..type = refer(valueType),
        ),
        // Inlined server-version metadata (type-level), if any.
        ...declarationVersionFields(type),
      ])
      ..constructors.add(
        Constructor(
          (c) => c
            ..constant = true
            ..name = '_'
            ..requiredParameters.add(
              Parameter((p) => p..toThis = true..name = 'value'),
            ),
        ),
      )
      ..methods.addAll([
        _fromJson(type, valueType, tolerant: tolerant),
        _toJson(),
        _toString(),
      ]),
  );
}

EnumValue _enumValue(EnumMember member, bool isInt) => EnumValue(
      (v) => v
        ..name = member.dartName
        ..docs.addAll(_memberDocs(member))
        ..constructorName = '_'
        ..arguments.add(_wireLiteralExpr(member.wireValue, isInt)),
    );

EnumValue _unknownValue(bool isInt) => EnumValue(
      (v) => v
        ..name = _unknownMember
        ..docs.addAll(const [
          '/// Reserved for values from newer servers. Never sent by this client.',
        ])
        ..constructorName = '_'
        // Int-backed enums have no spare sentinel value, so -1 stands in; the
        // member is only ever produced by [fromJson], never serialized back.
        ..arguments.add(_wireLiteralExpr(isInt ? -1 : _unknownWire, isInt)),
    );

Method _fromJson(EnumType type, String valueType, {required bool tolerant}) {
  final name = type.meta.dartName;
  final fallback = tolerant ? 'return value == null ? null : $_unknownMember;' : 'return null;';
  return Method(
    (m) => m
      ..static = true
      ..returns = refer('$name?')
      ..name = 'fromJson'
      ..requiredParameters.add(
        Parameter((p) => p..name = 'value'..type = refer('dynamic')),
      )
      ..body = Code('''
for (final e in values) {
  if (e.value == value) return e;
}
$fallback
'''),
  );
}

Method _toJson() => Method(
      (m) => m
        ..returns = refer('Object')
        ..name = 'toJson'
        ..lambda = true
        ..body = const Code('value'),
    );

Method _toString() => Method(
      (m) => m
        ..annotations.add(refer('override'))
        ..returns = refer('String')
        ..name = 'toString'
        ..lambda = true
        ..body = const Code('value.toString()'),
    );

Expression _wireLiteralExpr(Object wire, bool isInt) =>
    isInt ? literalNum(wire as num) : CodeExpression(Code(_rawString(wire.toString())));

/// A raw single-quoted Dart string literal. Wire values in this spec contain no
/// single quotes or backslashes, so `r'...'` is safe and matches client style.
String _rawString(String value) => "r'$value'";

List<String> _typeDocs(EnumType type) => _docLines(type.meta.description);

List<String> _memberDocs(EnumMember member) {
  final lines = _docLines(member.description);
  if (member.deprecated) {
    return [...lines, "@Deprecated('This enum value is deprecated.')"];
  }
  return lines;
}

List<String> _docLines(String? description) {
  if (description == null || description.trim().isEmpty) return const [];
  return description
      .trimRight()
      .split('\n')
      .map((line) => '/// ${line.trimRight()}')
      .toList(growable: false);
}
