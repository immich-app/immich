/// Turns a raw OpenAPI schema node into an IR [TypeModel] / [NamedType].
///
/// This is where every OpenAPI schema-level edge case is resolved once
/// (DESIGN §1, §5.4):
///
///   * `object` (or a `properties` map) → [ObjectType] with tri-state
///     required/nullable/default per property, in spec order.
///   * length-1 `allOf` + sibling `nullable`/`default` → the inner ref/type with
///     the sibling nullability/default lifted onto the owning [Property]
///     (collapse). A bare `$ref` with sibling `default`/`nullable` is treated
///     the same way.
///   * multi-member `allOf` → merge every member's properties into one flat
///     [ObjectType] (later member wins on conflict).
///   * `anyOf` / `oneOf` → [UnionType] (discriminator honored when present).
///   * string/int `enum` → [EnumType].
///   * `additionalProperties: {}` → free-form; `additionalProperties: {schema}`
///     → typed value map.
///   * arrays → [ArrayType] (`itemsNullable`, `uniqueItems` → `unique`).
///   * bare `$ref` schema body → [AliasType]; in-property `$ref` → [RefType].
///   * `format: binary` → [BinaryType]; date-time/date/double/num/uuid/email →
///     [PrimitiveType] with [ScalarConstraints].
///
/// Version metadata is attached to properties from `x-immich-history` /
/// `x-immich-state` via [buildVersionMeta].
library;

import '../ir/types.dart';
import '../loader/spec.dart';
import '../util/version.dart';
import 'overrides.dart';

/// Walks schema nodes into IR types against a loaded [OpenApiSpec].
class SchemaWalker {
  final OpenApiSpec spec;

  SchemaWalker(this.spec);

  /// Normalize a top-level `components.schemas` entry named [specName] into its
  /// declaration ([ObjectType], [EnumType], [UnionType], or [AliasType]).
  NamedType declarationFor(String specName, Map<String, dynamic> node) {
    final meta = _metaFor(specName, node);

    // Enum declaration.
    if (node['enum'] is List) {
      return _enumType(meta, node);
    }

    // Bare `$ref` schema body → typedef alias.
    final bareRef = OpenApiSpec.refName(node);
    if (bareRef != null && node['allOf'] == null) {
      return AliasType(meta: meta, target: RefType(bareRef));
    }

    // Top-level anyOf / oneOf → union declaration.
    if (node['anyOf'] is List || node['oneOf'] is List) {
      return _unionType(meta, node);
    }

    // allOf as a schema body → merge members into one flat object.
    if (node['allOf'] is List) {
      return _objectFromAllOf(meta, node['allOf'] as List, node);
    }

    // Default: an object.
    return _objectType(meta, node);
  }

  // ───────────────────────────── objects ──────────────────────────────────

  ObjectType _objectType(NamedMeta meta, Map<String, dynamic> node) {
    final properties = _propertiesFor(meta.specName, node);
    return ObjectType(
      meta: meta,
      properties: properties,
      additional: _additionalProps(node['additionalProperties']),
    );
  }

  /// Merge every member of a schema-body `allOf` into one flat [ObjectType].
  ///
  /// Each member is either a `$ref` to another object (its properties are
  /// pulled in) or an inline object body. Later members win on name conflict;
  /// spec order is otherwise preserved.
  ObjectType _objectFromAllOf(NamedMeta meta, List<dynamic> members, Map<String, dynamic> node) {
    final merged = <String, Property>{};
    final required = <String>{};
    AdditionalProps? additional;

    for (final raw in members) {
      if (raw is! Map<String, dynamic>) continue;
      final refName = OpenApiSpec.refName(raw);
      final member = refName != null ? spec.schemaByName(refName) : raw;
      final memberRequired = (member['required'] as List?)?.cast<String>() ?? const [];
      required.addAll(memberRequired);
      for (final prop in _propertiesFor(meta.specName, member)) {
        merged[prop.wireName] = prop;
      }
      additional ??= _additionalProps(member['additionalProperties']);
    }

    // Re-derive `required` across the merged set (a member may mark a property
    // required that another member declared).
    final props = [
      for (final prop in merged.values)
        prop.required == required.contains(prop.wireName)
            ? prop
            : _withRequired(prop, required.contains(prop.wireName)),
    ];

    return ObjectType(meta: meta, properties: props, additional: additional);
  }

  List<Property> _propertiesFor(String specName, Map<String, dynamic> node) {
    final props = node['properties'];
    if (props is! Map<String, dynamic>) return const [];
    final required = (node['required'] as List?)?.cast<String>().toSet() ?? const <String>{};

    final result = <Property>[];
    for (final entry in props.entries) {
      final wireName = entry.key;
      final p = entry.value;
      if (p is! Map<String, dynamic>) continue;
      result.add(_property(specName, wireName, p, required.contains(wireName)));
    }
    return result;
  }

  Property _property(String specName, String wireName, Map<String, dynamic> p, bool isRequired) {
    final forced = forcedRawFor(specName, wireName);
    final versionMeta = buildVersionMeta(p['x-immich-history'], p['x-immich-state']);
    final description = p['description'] is String ? p['description'] as String : null;
    final deprecated = p['deprecated'] == true;

    if (forced == ForcedRaw.freeform) {
      // Raw passthrough map; collapse any anyOf/allOf shape entirely.
      return Property(
        wireName: wireName,
        type: MapType(),
        required: isRequired,
        nullable: p['nullable'] == true,
        description: description,
        deprecated: deprecated,
        versionMeta: versionMeta,
        forcedRaw: forced,
      );
    }

    // Collapse length-1 allOf + siblings into the inner type, lifting the
    // sibling `nullable`/`default` onto this property.
    final collapsed = _collapseSingleAllOf(p);
    final nullable = collapsed['nullable'] == true;
    final type = walkType(collapsed);
    final defaultValue = _defaultValue(collapsed, type);

    return Property(
      wireName: wireName,
      type: type,
      required: isRequired,
      nullable: nullable,
      defaultValue: defaultValue,
      description: description,
      deprecated: deprecated,
      versionMeta: versionMeta,
      forcedRaw: forced,
    );
  }

  /// A length-1 `allOf` carrying sibling keywords collapses to the inner schema
  /// with the siblings merged in. `{allOf:[X], nullable:true, default:d}` →
  /// `{...X, nullable:true, default:d}`. Returns [p] unchanged otherwise.
  Map<String, dynamic> _collapseSingleAllOf(Map<String, dynamic> p) {
    final allOf = p['allOf'];
    if (allOf is! List || allOf.length != 1) return p;
    final inner = allOf.first;
    if (inner is! Map<String, dynamic>) return p;
    return {
      ...inner,
      for (final entry in p.entries)
        if (entry.key != 'allOf') entry.key: entry.value,
    };
  }

  AdditionalProps? _additionalProps(Object? raw) {
    if (raw == null || raw == false) return null;
    if (raw == true) return const AdditionalProps();
    if (raw is Map<String, dynamic>) {
      if (raw.isEmpty) return const AdditionalProps();
      return AdditionalProps(
        valueType: walkType(raw),
        nullable: raw['nullable'] == true,
      );
    }
    return const AdditionalProps();
  }

  // ───────────────────────────── enums ────────────────────────────────────

  EnumType _enumType(NamedMeta meta, Map<String, dynamic> node) {
    final values = (node['enum'] as List).where((v) => v != null).toList();
    final backing = node['type'] == 'integer' ? EnumBacking.integer : EnumBacking.string;
    final descriptions = _enumDescriptions(node);

    final members = <EnumMember>[
      for (var i = 0; i < values.length; i++)
        EnumMember(
          wireValue: values[i] as Object,
          description: i < descriptions.length ? descriptions[i] : null,
        ),
    ];
    return EnumType(meta: meta, backing: backing, members: members);
  }

  /// `x-enum-descriptions`, when present, parallel to the `enum` value list.
  List<String?> _enumDescriptions(Map<String, dynamic> node) {
    final d = node['x-enum-descriptions'];
    if (d is List) return [for (final e in d) e is String ? e : null];
    return const [];
  }

  // ───────────────────────────── unions ───────────────────────────────────

  UnionType _unionType(NamedMeta meta, Map<String, dynamic> node) {
    final isOneOf = node['oneOf'] is List;
    final members = (isOneOf ? node['oneOf'] : node['anyOf']) as List;
    final variants = <RefType>[
      for (final m in members)
        if (OpenApiSpec.refName(m) case final name?) RefType(name),
    ];
    return UnionType(
      meta: meta,
      composition: isOneOf ? UnionComposition.oneOf : UnionComposition.anyOf,
      variants: variants,
      discriminator: _discriminator(node['discriminator']),
    );
  }

  Discriminator? _discriminator(Object? raw) {
    if (raw is! Map<String, dynamic>) return null;
    final propertyName = raw['propertyName'];
    if (propertyName is! String) return null;
    final mapping = <String, RefType>{};
    final rawMapping = raw['mapping'];
    if (rawMapping is Map<String, dynamic>) {
      for (final entry in rawMapping.entries) {
        final refName = OpenApiSpec.refName({r'$ref': entry.value});
        if (refName != null) mapping[entry.key] = RefType(refName);
      }
    }
    return Discriminator(propertyName: propertyName, mapping: mapping);
  }

  // ─────────────────────────── type dispatch ──────────────────────────────

  /// Normalize any schema node used at a *value* position (property type, array
  /// item, map value, parameter, request/response body) into a [TypeModel].
  ///
  /// Unlike [declarationFor], a `$ref` here becomes a [RefType] (the named type
  /// stays named) rather than being dereferenced.
  TypeModel walkType(Map<String, dynamic> node) {
    // In-place ref → RefType (identity preserved).
    final ref = OpenApiSpec.refName(node);
    if (ref != null) return RefType(ref);

    // Inline composition at a value position.
    if (node['anyOf'] is List || node['oneOf'] is List) {
      return _inlineUnion(node);
    }
    if (node['allOf'] is List) {
      final collapsed = _collapseSingleAllOf(node);
      if (!identical(collapsed, node)) return walkType(collapsed);
      // Multi-member inline allOf at a value position is unusual; fall back.
      return UnknownType('inline multi-member allOf');
    }

    if (node['enum'] is List) {
      // Inline (anonymous) enum at a value position — no spec name to ref.
      // None exist in the Immich spec; surface rather than silently mis-typing.
      return UnknownType('inline anonymous enum');
    }

    final type = node['type'];
    switch (type) {
      case 'array':
        return _arrayType(node);
      case 'object':
        return _mapType(node);
      case 'string':
        return _stringType(node);
      case 'integer':
        return PrimitiveType(PrimitiveKind.integer, constraints: _constraints(node));
      case 'number':
        return _numberType(node);
      case 'boolean':
        return PrimitiveType(PrimitiveKind.boolean);
    }

    // No `type` and no `$ref`: `additionalProperties` alone → free-form map;
    // `properties` alone → object map; otherwise a fully free-form value.
    if (node['additionalProperties'] != null || node['properties'] != null) {
      return _mapType(node);
    }
    return FreeFormType();
  }

  TypeModel _inlineUnion(Map<String, dynamic> node) {
    final isOneOf = node['oneOf'] is List;
    final members = (isOneOf ? node['oneOf'] : node['anyOf']) as List;
    final refs = [for (final m in members) OpenApiSpec.refName(m)];
    if (refs.every((r) => r != null)) {
      // An inline union of refs we cannot name; fall back to the widest type.
      // (The named-union path in declarationFor handles the top-level case;
      // the only in-property anyOf in this spec is forced-raw via overrides.)
      return FreeFormType();
    }
    return UnknownType('inline union with inline members');
  }

  ArrayType _arrayType(Map<String, dynamic> node) {
    final itemsNode = node['items'];
    final items = itemsNode is Map<String, dynamic> ? walkType(itemsNode) : FreeFormType();
    final itemsNullable = itemsNode is Map<String, dynamic> && itemsNode['nullable'] == true;
    return ArrayType(
      items,
      itemsNullable: itemsNullable,
      unique: node['uniqueItems'] == true,
      minItems: node['minItems'] is int ? node['minItems'] as int : null,
      maxItems: node['maxItems'] is int ? node['maxItems'] as int : null,
    );
  }

  MapType _mapType(Map<String, dynamic> node) {
    final ap = node['additionalProperties'];
    if (ap is Map<String, dynamic> && ap.isNotEmpty) {
      return MapType(valueType: walkType(ap), valueNullable: ap['nullable'] == true);
    }
    return MapType();
  }

  TypeModel _stringType(Map<String, dynamic> node) {
    final format = node['format'];
    final constraints = _constraints(node);
    return switch (format) {
      'binary' => BinaryType(BinaryRole.upload),
      'date-time' => PrimitiveType(PrimitiveKind.dateTime, constraints: constraints),
      'date' => PrimitiveType(PrimitiveKind.date, constraints: constraints),
      _ => PrimitiveType(PrimitiveKind.string, constraints: constraints),
    };
  }

  TypeModel _numberType(Map<String, dynamic> node) {
    final format = node['format'];
    final constraints = _constraints(node);
    if (format == 'double' || format == 'float') {
      return PrimitiveType(PrimitiveKind.float, constraints: constraints);
    }
    // Bare `number` with no format → default to double (DESIGN §5.1.2).
    return PrimitiveType(PrimitiveKind.float, constraints: constraints, numberAmbiguous: true);
  }

  ScalarConstraints? _constraints(Map<String, dynamic> node) {
    final pattern = node['pattern'];
    final format = node['format'];
    final minimum = node['minimum'];
    final maximum = node['maximum'];
    final minLength = node['minLength'];
    final maxLength = node['maxLength'];
    if (pattern == null &&
        format == null &&
        minimum == null &&
        maximum == null &&
        minLength == null &&
        maxLength == null) {
      return null;
    }
    return ScalarConstraints(
      pattern: pattern is String ? pattern : null,
      format: format is String ? format : null,
      minimum: minimum is num ? minimum : null,
      maximum: maximum is num ? maximum : null,
      minLength: minLength is int ? minLength : null,
      maxLength: maxLength is int ? maxLength : null,
    );
  }

  // ───────────────────────────── defaults ─────────────────────────────────

  /// Build a [DefaultValue] from a `default` keyword on [node], typed by the
  /// resolved [type]. A `default` against an enum ref becomes an [EnumDefault].
  DefaultValue? _defaultValue(Map<String, dynamic> node, TypeModel type) {
    if (!node.containsKey('default')) return null;
    final raw = node['default'];
    if (raw == null) return const NullDefault();
    if (type is RefType) {
      // Default against a named type — almost always an enum member wire value.
      if (raw is String || raw is int) return EnumDefault(type, raw as Object);
      return null;
    }
    return switch (raw) {
      final bool b => BoolDefault(b),
      final num n => NumberDefault(n),
      final String s => StringDefault(s),
      _ => null,
    };
  }

  // ───────────────────────────── helpers ──────────────────────────────────

  NamedMeta _metaFor(String specName, Map<String, dynamic> node) => NamedMeta(
        specName: specName,
        description: node['description'] is String ? node['description'] as String : null,
        deprecated: node['deprecated'] == true,
        versionMeta: buildVersionMeta(node['x-immich-history'], node['x-immich-state']),
      );

  Property _withRequired(Property p, bool required) => Property(
        wireName: p.wireName,
        dartName: p.dartName,
        type: p.type,
        required: required,
        nullable: p.nullable,
        defaultValue: p.defaultValue,
        description: p.description,
        deprecated: p.deprecated,
        versionMeta: p.versionMeta,
        forcedRaw: p.forcedRaw,
      );
}
