/// Emits an [ObjectType] as an idiomatic immutable Dart `final class`.
///
/// The emitted shape (DESIGN §5.1, idiomatic end-state):
///
/// * `final class Foo` with every field `final`.
/// * A `const` constructor (all emitted defaults are compile-time constants,
///   including enum defaults, which reference the const member `Type.member`).
/// * The tri-state required×nullable matrix decides field nullability and the
///   constructor parameter form:
///
///   | required | nullable | field    | ctor param          |
///   |----------|----------|----------|---------------------|
///   | ✓        | ✗        | `T x`    | `required this.x`   |
///   | ✓        | ✓        | `T? x`   | `required this.x`   |
///   | ✗ + def  | ✗        | `T x`    | `this.x = <default>`|
///   | ✗        | ✓        | `T? x`   | `this.x`            |
///
/// * `static Foo? fromJson(dynamic value)` — optionally runs the in-library
///   `ApiCompat.upgrade` back-fill hook first, then `if (value is! Map) return
///   null`, then builds via [readExpr] off `json[r'wireName']`.
/// * `Map<String, dynamic> toJson()` that OMITS null/absent values (never
///   writes `json[k] = null`).
/// * `operator ==` + `hashCode` using `const DeepCollectionEquality()` for
///   collection-typed fields.
/// * `copyWith(...)` using a private `_undefined` sentinel so `copyWith(x: null)`
///   clears a nullable field rather than being ignored.
/// * `toString()`.
///
/// Free-form `additionalProperties` and a `forcedRaw` (freeform) property both
/// surface as a raw `Map<String, dynamic>` with passthrough (de)serialization.
library;

import 'package:code_builder/code_builder.dart';

import '../ir/types.dart';
import '../util/naming.dart';
import 'dart_types.dart';
import 'emit_meta.dart';
import 'serialization.dart';

/// Builds the `final class` declaration for [type].
///
/// [options] controls the `upgradeDto` compat-hook call site
/// ([GeneratorOptions.emitCompatHook]).
Class emitModel(ObjectType type, GeneratorOptions options) {
  final fields = _fields(type);
  final hasAdditional = _additionalMapField(type) != null;
  final classDeprecation = deprecationMessage(type.meta.versionMeta, specDeprecated: type.meta.deprecated);

  return Class(
    (b) => b
      ..modifier = ClassModifier.final$
      ..name = type.meta.dartName
      ..docs.addAll([
        ..._docLines(type.meta.description),
        for (final line in sinceDocLines(type.meta.versionMeta)) '/// $line',
      ])
      ..annotations.addAll(classDeprecation != null ? [_deprecatedAnnotation(classDeprecation)] : const [])
      ..constructors.add(_constructor(fields))
      ..fields.addAll([
        for (final f in fields) _declareField(f),
        if (fields.any((f) => f.fieldNullable)) _sentinelField(),
        // Inlined server-version metadata (e.g. `static const isEditedAddedIn`).
        ...declarationVersionFields(type),
      ])
      ..methods.addAll([
        _fromJson(type, fields, options),
        _toJson(fields, hasAdditional: hasAdditional),
        _copyWith(type, fields),
        _equals(type, fields),
        _hashCode(fields),
        _toStringMethod(type, fields),
      ]),
  );
}

// ───────────────────────────── field model ─────────────────────────────────

/// A resolved view of one emitted Dart field, derived from the IR.
class _FieldSpec {
  final String dartName;
  final String wireName;
  final String dartType;
  final TypeModel type;

  /// True when the Dart field type carries a `?`.
  final bool fieldNullable;

  /// True when the constructor parameter is `required`.
  final bool required;

  /// The Dart constructor default expression, or null when none.
  final String? defaultExpr;

  /// True when this default is a compile-time constant (gates the const ctor).
  final bool defaultIsConst;

  /// True when read/write is raw passthrough (free-form / forcedRaw maps).
  final bool rawPassthrough;

  final bool isCollection;
  final bool deprecated;
  final DefaultValue? defaultValue;
  final String? description;

  /// True when the field is a three-state `Option<T?>` (request-body DTO,
  /// optional property): absent / present-null / present-value.
  final bool optionWrapped;

  /// For [optionWrapped] fields, whether the wrapped value type is nullable
  /// (`Optional<bool?>` vs `Optional<String>`).
  final bool optionInnerNullable;

  /// Server-version metadata for this field, driving `@since` docs and
  /// `@Deprecated` annotations.
  final VersionMeta? versionMeta;

  _FieldSpec({
    required this.dartName,
    required this.wireName,
    required this.dartType,
    required this.type,
    required this.fieldNullable,
    required this.required,
    required this.defaultExpr,
    required this.defaultIsConst,
    required this.rawPassthrough,
    required this.isCollection,
    required this.deprecated,
    required this.defaultValue,
    required this.description,
    this.optionWrapped = false,
    this.optionInnerNullable = false,
    this.versionMeta,
  });
}

List<_FieldSpec> _fields(ObjectType type) {
  final specs = <_FieldSpec>[
    for (final p in type.properties) _fromProperty(p, threeState: type.threeState),
  ];
  final additional = _additionalMapField(type);
  if (additional != null) specs.add(additional);
  return specs;
}

_FieldSpec _fromProperty(Property p, {required bool threeState}) {
  final raw = p.forcedRaw == ForcedRaw.freeform;

  // Three-state: in a JSON request-body DTO, an optional property becomes
  // `Option<T?>` (absent / present-null / present-value) defaulting to absent.
  if (threeState && !p.required && !raw) {
    final inner = dartType(p.type, nullable: p.nullable);
    return _FieldSpec(
      dartName: p.dartName,
      wireName: p.wireName,
      dartType: 'Optional<$inner>',
      type: p.type,
      fieldNullable: false,
      required: false,
      defaultExpr: 'const Optional.absent()',
      defaultIsConst: true,
      rawPassthrough: false,
      isCollection: false,
      deprecated: p.deprecated,
      defaultValue: null,
      description: p.description,
      optionWrapped: true,
      optionInnerNullable: p.nullable,
      versionMeta: p.versionMeta,
    );
  }

  // forcedRaw collapses the property to a raw nullable Map regardless of its
  // declared type (the AssetEditActionItemDto.parameters case).
  final fieldNullable = raw ? true : p.nullable || (!p.required && p.defaultValue == null);
  final dartTypeStr = raw ? 'Map<String, dynamic>?' : dartType(p.type, nullable: fieldNullable);
  final defaultExpr = p.defaultValue == null ? null : _defaultExpr(p.defaultValue!);

  return _FieldSpec(
    dartName: p.dartName,
    wireName: p.wireName,
    dartType: dartTypeStr,
    type: p.type,
    fieldNullable: fieldNullable,
    required: p.required,
    defaultExpr: defaultExpr,
    defaultIsConst: p.defaultValue == null ? true : _isConstDefault(p.defaultValue!),
    rawPassthrough: raw,
    isCollection: !raw && _isCollection(p.type),
    deprecated: p.deprecated,
    defaultValue: p.defaultValue,
    description: p.description,
    versionMeta: p.versionMeta,
  );
}

/// Builds the synthetic `additionalProperties` field, or null when absent.
///
/// Both free-form (`valueType == null`) and typed value maps surface as a
/// single nullable Dart map field named `additionalProperties`.
_FieldSpec? _additionalMapField(ObjectType type) {
  final additional = type.additional;
  if (additional == null) return null;
  final mapType = MapType(valueType: additional.valueType, valueNullable: additional.nullable);
  return _FieldSpec(
    dartName: 'additionalProperties',
    wireName: '',
    dartType: '${dartType(mapType, nullable: false)}?',
    type: mapType,
    fieldNullable: true,
    required: false,
    defaultExpr: null,
    defaultIsConst: true,
    rawPassthrough: additional.valueType == null,
    isCollection: true,
    deprecated: false,
    defaultValue: null,
    description: 'Additional, schema-free properties.',
  );
}

bool _isCollection(TypeModel t) => t is ArrayType || t is MapType;

// ───────────────────────────── constructor ─────────────────────────────────

Constructor _constructor(List<_FieldSpec> fields) {
  // The constructor can be const only when every defaulted field has a const
  // default (enum defaults via fromJson are not const).
  final canBeConst = fields.every((f) => f.defaultExpr == null || f.defaultIsConst);
  return Constructor(
    (c) => c
      ..constant = canBeConst
      ..optionalParameters.addAll([for (final f in fields) _ctorParam(f)]),
  );
}

Parameter _ctorParam(_FieldSpec f) => Parameter(
      (p) => p
        ..named = true
        ..toThis = true
        ..name = f.dartName
        ..required = f.required
        ..defaultTo = f.defaultExpr == null ? null : Code(f.defaultExpr!),
    );

/// A per-class sentinel distinguishing "argument omitted" from "set to null"
/// in [copyWith]. Self-contained so no shared library symbol is required.
Field _sentinelField() => Field(
      (b) => b
        ..static = true
        ..modifier = FieldModifier.constant
        ..name = '_undefined'
        ..assignment = const Code('Object()'),
    );

Field _declareField(_FieldSpec f) {
  final depMessage = deprecationMessage(f.versionMeta, specDeprecated: f.deprecated);
  return Field(
    (b) => b
      ..modifier = FieldModifier.final$
      ..name = f.dartName
      ..type = refer(f.dartType)
      ..docs.addAll(_fieldDocs(f))
      ..annotations.addAll(depMessage != null ? [_deprecatedAnnotation(depMessage)] : const []),
  );
}

List<String> _fieldDocs(_FieldSpec f) => [
      ..._docLines(f.description),
      for (final line in sinceDocLines(f.versionMeta)) '/// $line',
    ];

// ───────────────────────────── fromJson ────────────────────────────────────

Method _fromJson(ObjectType type, List<_FieldSpec> fields, GeneratorOptions options) {
  final name = type.meta.dartName;
  final buffer = StringBuffer();
  if (options.emitCompatHook) {
    // In-library backward-compat hook; the host app registers the rules.
    // Keyed by the DTO type (not a string) so registrations are compile-checked.
    buffer.writeln('ApiCompat.upgrade<$name>(value);');
  }
  buffer.writeln('if (value is! Map) return null;');
  buffer.writeln('final json = value.cast<String, dynamic>();');
  buffer.writeln('return .new(');
  for (final f in fields) {
    buffer.writeln('  ${f.dartName}: ${_readField(f)},');
  }
  buffer.writeln(');');

  return Method(
    (m) => m
      ..static = true
      ..returns = refer('$name?')
      ..name = 'fromJson'
      ..requiredParameters.add(
        Parameter((p) => p..name = 'value'..type = refer('dynamic')),
      )
      ..body = Code(buffer.toString()),
  );
}

/// The read expression assigned to one field inside `fromJson`.
String _readField(_FieldSpec f) {
  if (f.dartName == 'additionalProperties') {
    // The additionalProperties map is read as the whole JSON object (typed maps
    // would need key filtering, which the current spec never requires).
    return f.rawPassthrough
        ? 'json.cast<String, dynamic>()'
        : readExpr(f.type, 'json', nullable: true);
  }
  final access = 'json[${_rawString(f.wireName)}]';
  if (f.optionWrapped) {
    // Three-state: present iff the key exists (value may itself be null).
    final present = readExpr(f.type, access, nullable: f.optionInnerNullable);
    return 'json.containsKey(${_rawString(f.wireName)}) ? Optional.present($present) : const Optional.absent()';
  }
  if (f.rawPassthrough) {
    return '($access as Map?)?.cast<String, dynamic>()';
  }
  // Matrix rows:
  //  required + non-null  → readExpr(nullable:false)             → force `!`
  //  required + nullable  → readExpr(nullable:true)
  //  optional + default   → readExpr(nullable:true, def:default) → `?? default`
  //  optional + nullable  → readExpr(nullable:true)
  if (f.required && !f.fieldNullable) {
    return readExpr(f.type, access, nullable: false);
  }
  if (!f.required && f.defaultValue != null) {
    return readExpr(f.type, access, nullable: true, def: f.defaultValue);
  }
  return readExpr(f.type, access, nullable: true);
}

// ───────────────────────────── toJson ──────────────────────────────────────

Method _toJson(List<_FieldSpec> fields, {required bool hasAdditional}) {
  final buffer = StringBuffer();
  buffer.writeln('final json = <String, dynamic>{};');
  for (final f in fields) {
    if (f.dartName == 'additionalProperties') {
      buffer.writeln('if (${f.dartName} != null) json.addAll(${f.dartName}!);');
      continue;
    }
    if (f.optionWrapped) {
      // Three-state: write the key only when present (absent ⇒ omitted;
      // present-null ⇒ explicit null).
      final inner = writeExpr(f.type, 'value', nullable: f.optionInnerNullable);
      buffer.writeln('if (${f.dartName} case Present(:final value)) {');
      buffer.writeln('  json[${_rawString(f.wireName)}] = $inner;');
      buffer.writeln('}');
      continue;
    }
    final value = _writeField(f);
    if (f.fieldNullable) {
      buffer.writeln('if (${f.dartName} != null) {');
      buffer.writeln('  json[${_rawString(f.wireName)}] = $value;');
      buffer.writeln('}');
    } else {
      buffer.writeln('json[${_rawString(f.wireName)}] = $value;');
    }
  }
  buffer.writeln('return json;');

  return Method(
    (m) => m
      ..returns = refer('Map<String, dynamic>')
      ..name = 'toJson'
      ..body = Code(buffer.toString()),
  );
}

/// The write expression for one field inside `toJson`.
///
/// Inside the `if (f != null)` guard the value is known non-null, so we ask
/// [writeExpr] for the non-null form and force-unwrap the access.
String _writeField(_FieldSpec f) {
  if (f.rawPassthrough) return f.dartName;
  if (f.fieldNullable) {
    return writeExpr(f.type, '${f.dartName}!', nullable: false);
  }
  return writeExpr(f.type, f.dartName, nullable: false);
}

// ───────────────────────────── copyWith ────────────────────────────────────

Method _copyWith(ObjectType type, List<_FieldSpec> fields) {
  final name = type.meta.dartName;
  final buffer = StringBuffer();
  buffer.writeln('return .new(');
  for (final f in fields) {
    if (f.fieldNullable) {
      // The sentinel lets `copyWith(x: null)` clear the field; an absent arg
      // (still the sentinel) preserves the current value.
      buffer.writeln(
        '  ${f.dartName}: identical(${f.dartName}, _undefined) ? this.${f.dartName} : ${f.dartName} as ${f.dartType},',
      );
    } else {
      buffer.writeln('  ${f.dartName}: ${f.dartName} ?? this.${f.dartName},');
    }
  }
  buffer.writeln(');');

  return Method(
    (m) => m
      ..returns = refer(name)
      ..name = 'copyWith'
      ..optionalParameters.addAll([for (final f in fields) _copyWithParam(f)])
      ..body = Code(buffer.toString()),
  );
}

Parameter _copyWithParam(_FieldSpec f) => Parameter(
      (p) => p
        ..named = true
        ..name = f.dartName
        // Nullable fields take `Object?` defaulted to the `_undefined` sentinel
        // so we can distinguish "clear to null" from "leave unchanged".
        ..type = refer(f.fieldNullable ? 'Object?' : '${f.dartType}?')
        ..defaultTo = f.fieldNullable ? const Code('_undefined') : null,
    );

// ───────────────────────────── equality ────────────────────────────────────

Method _equals(ObjectType type, List<_FieldSpec> fields) {
  final name = type.meta.dartName;
  final buffer = StringBuffer();
  buffer.write('return identical(this, other) || (other is $name');
  for (final f in fields) {
    buffer.write(' &&\n    ');
    if (f.isCollection) {
      buffer.write('const DeepCollectionEquality().equals(${f.dartName}, other.${f.dartName})');
    } else {
      buffer.write('${f.dartName} == other.${f.dartName}');
    }
  }
  buffer.write(');');

  return Method(
    (m) => m
      ..annotations.add(refer('override'))
      ..returns = refer('bool')
      ..name = 'operator =='
      ..requiredParameters.add(
        Parameter((p) => p..name = 'other'..type = refer('Object')),
      )
      ..lambda = false
      ..body = Code(buffer.toString()),
  );
}

Method _hashCode(List<_FieldSpec> fields) {
  final String body;
  if (fields.isEmpty) {
    body = 'return runtimeType.hashCode;';
  } else {
    final parts = [
      for (final f in fields)
        f.isCollection
            ? 'const DeepCollectionEquality().hash(${f.dartName})'
            : f.dartName,
    ];
    body = 'return Object.hashAll([\n  ${parts.join(',\n  ')},\n]);';
  }
  return Method(
    (m) => m
      ..annotations.add(refer('override'))
      ..returns = refer('int')
      ..type = MethodType.getter
      ..name = 'hashCode'
      ..body = Code(body),
  );
}

// ───────────────────────────── toString ────────────────────────────────────

Method _toStringMethod(ObjectType type, List<_FieldSpec> fields) {
  final name = type.meta.dartName;
  // The label is literal text, so escape any `$` in an escaped-reserved-word
  // identifier (e.g. `library$`). The value uses simple `$id` interpolation,
  // but falls back to `${id}` braces when the identifier itself contains `$`
  // (`$library$` would otherwise interpolate `library` + a dangling `$`).
  final parts = fields.map((f) {
    final label = f.dartName.replaceAll(r'$', r'\$');
    final value = f.dartName.contains(r'$') ? '\${${f.dartName}}' : '\$${f.dartName}';
    return '$label=$value';
  }).join(', ');
  return Method(
    (m) => m
      ..annotations.add(refer('override'))
      ..returns = refer('String')
      ..name = 'toString'
      ..lambda = true
      ..body = Code("'$name($parts)'"),
  );
}

// ───────────────────────────── defaults ────────────────────────────────────

String _defaultExpr(DefaultValue def) {
  switch (def) {
    case NullDefault():
      return 'null';
    case BoolDefault():
      return def.value ? 'true' : 'false';
    case NumberDefault():
      return def.value.toString();
    case StringDefault():
      return _rawString(def.value);
    case EnumDefault():
      // A constructor default must be a constant, so reference the enum member
      // identifier directly (e.g. `AlbumUserRole.editor`) rather than the
      // non-const `fromJson(...)!`. The member name is derived with the same
      // sanitizer resolveNames uses, so it matches the emitted enum member.
      final type = def.enumRef.dartName ?? def.enumRef.specName;
      final member = sanitizeEnumMember(def.enumMemberWire);
      return '$type.$member';
  }
}

/// Whether [def] yields a compile-time constant default. All current default
/// expressions are const: literals are const, and [EnumDefault] resolves to a
/// const enum member reference. Retained as a hook for future non-const cases.
bool _isConstDefault(DefaultValue def) => switch (def) {
      NullDefault() || BoolDefault() || NumberDefault() || StringDefault() || EnumDefault() => true,
    };

// ───────────────────────────── helpers ─────────────────────────────────────

Expression _deprecatedAnnotation(String message) =>
    refer('Deprecated').call([CodeExpression(Code(_rawString(message)))]);

String _rawString(String value) => "r'$value'";

List<String> _docLines(String? description) {
  if (description == null || description.trim().isEmpty) return const [];
  return description
      .trimRight()
      .split('\n')
      .map((line) => '/// ${line.trimRight()}')
      .toList(growable: false);
}
