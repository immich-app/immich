/// The name-resolution pass: fills every `dartName`/`fileName` slot on the IR.
///
/// Run after the walkers and before any emitter. Assigns:
///   * PascalCase `dartName` + snake_case `fileName` on every [NamedType]
///     ([ObjectType], [EnumType], [UnionType], [AliasType]);
///   * sanitized lowerCamelCase `dartName` on every [EnumMember];
///   * camelCase `dartName` on every [Property], [Param], [OperationModel], and
///     PascalCase `dartName` (+ snake `fileName`) on every [ApiModel];
///   * the resolved target `dartName` on every [RefType] reachable from a
///     declaration, property, parameter, body, or response.
///
/// Class/file names are allocated through collision-safe registries so two spec
/// schemas that PascalCase to the same identifier get a stable numeric suffix.
/// All ordering is deterministic: declarations are processed in the order the
/// builder hands them over, and member/property/param names are resolved in
/// spec order within each owner.
library;

import '../ir/types.dart';
import '../util/naming.dart';

/// Resolve every name slot on [doc] in place.
///
/// [doc] is mutated (its `dartName`/`fileName` fields are filled); the same
/// instance is returned for convenience.
IrDocument resolveNames(IrDocument doc) {
  final resolver = _NameResolver();
  resolver.run(doc);
  return doc;
}

class _NameResolver {
  /// specName → resolved Dart class/enum/typedef name, for [RefType] lookup.
  final Map<String, String> _bySpecName = {};

  final _Registry _classNames = _Registry();
  final _Registry _fileNames = _Registry();

  void run(IrDocument doc) {
    // Pass 1: allocate every declaration's class + file name so refs resolve.
    for (final decl in doc.declarations) {
      final dartName = _classNames.allocate(toPascalCase(decl.meta.specName));
      final fileName = _fileNames.allocate(toSnakeCase(decl.meta.specName));
      decl.meta.dartName = dartName;
      decl.meta.fileName = fileName;
      _bySpecName[decl.meta.specName] = dartName;
    }

    // Pass 2: resolve member/property/nested-ref names now that the map is full.
    for (final decl in doc.declarations) {
      _resolveDeclaration(decl);
    }

    // Pass 3: APIs and their operations/params.
    for (final api in doc.apis) {
      _resolveApi(api);
    }
  }

  void _resolveDeclaration(NamedType decl) {
    switch (decl) {
      case EnumType():
        _resolveEnum(decl);
      case ObjectType():
        for (final prop in decl.properties) {
          prop.dartName = _propertyName(prop.wireName);
          _resolveRefs(prop.type);
        }
        if (decl.additional?.valueType case final t?) _resolveRefs(t);
      case UnionType():
        for (final variant in decl.variants) {
          _fillRef(variant);
        }
        if (decl.discriminator case final d?) {
          for (final ref in d.mapping.values) {
            _fillRef(ref);
          }
        }
      case AliasType():
        _fillRef(decl.target);
    }
  }

  void _resolveEnum(EnumType e) {
    final seen = <String>{};
    for (final member in e.members) {
      var name = sanitizeEnumMember(member.wireValue);
      // Suffix on collision (two wire values sanitizing to the same identifier).
      name = _dedupe(name, seen);
      member.dartName = name;
    }
  }

  void _resolveApi(ApiModel api) {
    // "Users (admin)" → `UsersAdminApi`; "API keys" → `ApiKeysApi`.
    final base = toPascalCase(api.tag);
    api.dartName = _classNames.allocate('${base}Api');
    api.fileName = _fileNames.allocate('${toSnakeCase(api.tag)}_api');

    final seen = <String>{};
    for (final op in api.operations) {
      op.dartName = _dedupe(toCamelCase(op.operationId), seen);
      for (final p in [...op.pathParams, ...op.queryParams, ...op.headerParams]) {
        p.dartName = _propertyName(p.wireName);
        _resolveRefs(p.type);
      }
      if (op.body case final body?) _resolveBodyRefs(body);
      for (final resp in op.responses) {
        if (resp.type case final t?) _resolveRefs(t);
      }
    }
  }

  void _resolveBodyRefs(RequestBody body) {
    switch (body.content) {
      case JsonBody(:final type):
        _resolveRefs(type);
      case UrlEncodedBody(:final type):
        _resolveRefs(type);
      case MultipartBody(:final type, :final parts):
        _fillRef(type);
        for (final part in parts) {
          _resolveRefs(part.type);
        }
    }
  }

  /// Recursively fill any [RefType] reachable through container types.
  void _resolveRefs(TypeModel t) {
    switch (t) {
      case RefType():
        _fillRef(t);
      case ArrayType():
        _resolveRefs(t.items);
      case MapType():
        if (t.valueType case final v?) _resolveRefs(v);
      case PrimitiveType():
      case EnumType():
      case ObjectType():
      case UnionType():
      case AliasType():
      case BinaryType():
      case FreeFormType():
      case UnknownType():
        break;
    }
  }

  void _fillRef(RefType ref) {
    ref.dartName = _bySpecName[ref.specName] ?? toPascalCase(ref.specName);
  }

  String _propertyName(String wireName) => toCamelCase(wireName);

  /// Append `N` (2, 3, …) to [name] until it is unused in [seen], recording it.
  String _dedupe(String name, Set<String> seen) {
    if (seen.add(name)) return name;
    var n = 2;
    while (!seen.add('$name$n')) {
      n++;
    }
    return '$name$n';
  }
}

/// A collision-safe identifier allocator. The first claim on a candidate wins
/// it verbatim; later claims get a stable numeric suffix (`Foo`, `Foo2`, …).
class _Registry {
  final Set<String> _used = {};

  String allocate(String candidate) {
    if (_used.add(candidate)) return candidate;
    var n = 2;
    while (!_used.add('$candidate$n')) {
      n++;
    }
    return '$candidate$n';
  }
}
