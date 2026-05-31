/// Emits a [UnionType] (`oneOf` / `anyOf`) as an idiomatic sealed hierarchy.
///
/// DESIGN §5.3. The shape is a `sealed class <Name>` base plus one
/// `final class` leaf per variant, each holding the decoded variant value.
/// Because the base is `sealed`, a consumer `switch` over the union is
/// exhaustiveness-checked by the analyzer, and the wrapped value is reached by
/// destructuring the leaf's `value` field:
///
/// ```dart
/// final label = switch (parameters) {
///   AssetEditActionItemDtoParametersCrop(:final value) => 'crop ${value.width}',
///   AssetEditActionItemDtoParametersRotate(:final value) => 'rotate ${value.angle}',
///   AssetEditActionItemDtoParametersMirror(:final value) => 'mirror ${value.axis}',
/// };
/// ```
///
/// ## Dispatch
///
///   * **Discriminated** ([UnionType.discriminator] != null) — read the
///     discriminator property off the JSON map and `switch` over the mapping to
///     pick a leaf. An unmapped value throws
///     `ApiException(0, 'Unknown <Name> discriminator: $tag')`.
///   * **Discriminator-less** (the Immich `anyOf` case) — try each variant's
///     `fromJson` in spec order and wrap the first that succeeds (non-null),
///     else return null.
///
/// ## Leaf naming
///
/// A leaf is named `<UnionDartName><VariantDartName>`. Prefixing with the union
/// name keeps the leaf distinct from the variant's own `$ref` class (which is a
/// separate top-level declaration) and is collision-free across unions.
///
/// Method bodies are raw [Code] strings: `code_builder` models declarations,
/// not statements, so `switch`/dispatch logic is emitted as source text.
library;

import 'package:code_builder/code_builder.dart';

import '../ir/types.dart';
import 'emit_meta.dart';
import 'serialization.dart';

/// Emits the sealed base and every variant leaf for [union].
///
/// Returns the specs in a stable order (base first, then leaves in spec order)
/// so the output is byte-deterministic. The caller renders them into the
/// union's own `part of` file.
Iterable<Spec> emitUnion(UnionType union) {
  final name = union.meta.dartName;
  final leaves = [for (final v in union.variants) _Leaf(union, v)];
  return [
    _base(union, name, leaves),
    for (final leaf in leaves) leaf.spec,
  ];
}

/// A variant leaf: its Dart class name and the variant value's Dart type.
class _Leaf {
  _Leaf(this.union, this.variant)
      : valueType = variant.dartName ?? variant.specName,
        className = '${union.meta.dartName}${variant.dartName ?? variant.specName}';

  final UnionType union;
  final RefType variant;

  /// The variant's resolved Dart type (the `$ref` target class).
  final String valueType;

  /// The leaf wrapper class name, e.g. `…ParametersCropParameters`.
  final String className;

  Class get spec => Class(
        (b) => b
          ..name = className
          ..modifier = ClassModifier.final$
          ..extend = refer(union.meta.dartName)
          ..docs.add('/// The `$valueType` variant of [${union.meta.dartName}].')
          ..constructors.add(
            Constructor(
              (c) => c
                ..constant = true
                ..requiredParameters.add(
                  Parameter((p) => p
                    ..name = 'value'
                    ..toThis = true),
                ),
            ),
          )
          ..fields.add(
            Field((f) => f
              ..name = 'value'
              ..type = refer(valueType)
              ..modifier = FieldModifier.final$
              ..docs.add('/// The wrapped variant value.')),
          ),
      );
}

/// The `sealed class <Name>` base with the `fromJson` dispatcher and `toJson`.
Class _base(UnionType union, String name, List<_Leaf> leaves) => Class(
      (b) => b
        ..name = name
        ..sealed = true
        ..docs.addAll(_baseDocs(union))
        ..constructors.add(Constructor((c) => c..constant = true))
        ..fields.addAll(declarationVersionFields(union))
        ..methods.add(_fromJson(union, name, leaves))
        ..methods.add(_toJson(union, leaves)),
    );

List<String> _baseDocs(UnionType union) {
  final composition = switch (union.composition) {
    UnionComposition.oneOf => 'oneOf',
    UnionComposition.anyOf => 'anyOf',
  };
  return [
    '/// A `$composition` union with one leaf per variant.',
    '///',
    '/// Switch over the sealed subtypes to read the wrapped value.',
    if (union.meta.description != null) '///\n/// ${union.meta.description}',
  ];
}

/// `static <Name>? fromJson(dynamic value)`.
Method _fromJson(UnionType union, String name, List<_Leaf> leaves) => Method(
      (m) => m
        ..static = true
        ..returns = refer('$name?')
        ..name = 'fromJson'
        ..requiredParameters.add(
          Parameter((p) => p
            ..name = 'value'
            ..type = refer('dynamic')),
        )
        ..docs.add(
          '/// Decodes [value] into one of the ${union.meta.dartName} variants, '
          'or null.',
        )
        ..body = Code(
          union.discriminator != null
              ? _discriminatedBody(union, name, leaves)
              : _structuralBody(leaves),
        ),
    );

/// Tagged dispatch: read the discriminator property, switch over the mapping.
String _discriminatedBody(UnionType union, String name, List<_Leaf> leaves) {
  final disc = union.discriminator!;
  final prop = disc.propertyName;
  // Map each discriminator wire value to the leaf that wraps the mapped ref.
  final byVariant = {for (final l in leaves) l.variant.specName: l};
  final cases = StringBuffer();
  for (final entry in disc.mapping.entries) {
    final leaf = byVariant[entry.value.specName];
    if (leaf == null) continue;
    final read = readExpr(leaf.variant, 'value', nullable: false);
    cases.writeln('    case ${_stringLit(entry.key)}:');
    cases.writeln('      return ${leaf.className}($read);');
  }
  return '''
if (value is! Map) {
  return null;
}
final json = value.cast<String, dynamic>();
final discriminator = json[${_stringLit(prop)}];
switch (discriminator) {
${cases.toString().trimRight()}
  default:
    throw ApiException(0, 'Unknown $name discriminator: \$discriminator');
}
''';
}

/// Structural dispatch: try each variant in spec order, wrap the first hit.
String _structuralBody(List<_Leaf> leaves) {
  final attempts = StringBuffer();
  for (final leaf in leaves) {
    // Each variant's fromJson tolerates a non-matching shape by returning null.
    attempts.writeln('final ${_localFor(leaf)} = ${leaf.valueType}.fromJson(value);');
    attempts.writeln('if (${_localFor(leaf)} != null) {');
    attempts.writeln('  return ${leaf.className}(${_localFor(leaf)});');
    attempts.writeln('}');
  }
  return '${attempts.toString().trimRight()}\nreturn null;';
}

String _localFor(_Leaf leaf) =>
    'as${leaf.variant.dartName ?? leaf.variant.specName}';

/// `Object? toJson()` — delegates to the wrapped value of the active leaf.
///
/// The pattern `case <Leaf>(:final value)` binds the wrapped value, then the
/// shared [writeExpr] core produces the JSON-encodable form for the variant's
/// `$ref` type (a `.toJson()` call, never null since the leaf value is
/// non-null).
Method _toJson(UnionType union, List<_Leaf> leaves) {
  final cases = StringBuffer();
  for (final leaf in leaves) {
    final write = writeExpr(leaf.variant, 'value', nullable: false);
    cases.writeln('    case ${leaf.className}(:final value):');
    cases.writeln('      return $write;');
  }
  return Method(
    (m) => m
      ..returns = refer('Object?')
      ..name = 'toJson'
      ..docs.add('/// Encodes the active variant back to its JSON value.')
      ..body = Code('''
final self = this;
switch (self) {
${cases.toString().trimRight()}
}
'''),
  );
}

String _stringLit(String value) => "r'$value'";
