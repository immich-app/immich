/// The normalization entry point: [buildIr] drives the walkers and the
/// name-resolution pass to turn a loaded [OpenApiSpec] into a fully-named,
/// deterministically-ordered [IrDocument].
///
/// After this returns, nothing reads the raw OpenAPI document again (DESIGN §2).
library;

import '../ir/types.dart';
import '../loader/spec.dart';
import 'names.dart';
import 'operation_walker.dart';
import 'schema_walker.dart';

/// Normalize [spec] into the IR.
///
/// Steps:
///   1. Walk every `components.schemas` entry into a [NamedType] declaration.
///   2. Walk every path operation into tag-grouped [ApiModel]s.
///   3. Parse the security schemes.
///   4. Order declarations topologically (dependencies first) with an
///      alphabetical tiebreak, for deterministic, dependency-stable output.
///   5. Run [resolveNames] to fill every `dartName`/`fileName` slot.
///
/// The returned [IrDocument] is the sole input to the emitters.
IrDocument buildIr(OpenApiSpec spec) {
  final schemaWalker = SchemaWalker(spec);

  // 1. Declarations, processed in alphabetical spec-name order for stability.
  final specNames = spec.schemas.keys.toList()..sort();
  final declarations = <NamedType>[
    for (final name in specNames) schemaWalker.declarationFor(name, spec.schemaByName(name)),
  ];

  // 2. Operations grouped by tag.
  final apis = OperationWalker(spec, schemaWalker).walk();

  // 2b. Flag DTOs used as JSON request bodies — their optional fields are
  // emitted as three-state `Option<T?>`.
  _markThreeStateDtos(declarations, apis);

  // 3. Security schemes.
  final security = _securitySchemes(spec.securitySchemes);

  // 4. Topological + alphabetical ordering.
  final ordered = _topoAlphaOrder(declarations);

  final doc = IrDocument(
    declarations: ordered,
    apis: apis,
    security: security,
    info: spec.info,
  );

  // 5. Names.
  return resolveNames(doc);
}

// ─────────────────────────── three-state ───────────────────────────────────

/// Mark every [ObjectType] used as a JSON request body so its optional fields
/// become three-state `Option<T?>` (absent / null / present).
void _markThreeStateDtos(List<NamedType> declarations, List<ApiModel> apis) {
  final objectsByName = <String, ObjectType>{
    for (final d in declarations)
      if (d is ObjectType) d.meta.specName: d,
  };
  for (final api in apis) {
    for (final op in api.operations) {
      final content = op.body?.content;
      if (content is JsonBody) {
        final t = content.type;
        if (t is RefType) {
          objectsByName[t.specName]?.threeState = true;
        }
      }
    }
  }
}

// ───────────────────────────── security ────────────────────────────────────

List<SecurityScheme> _securitySchemes(Map<String, dynamic> raw) {
  final result = <SecurityScheme>[];
  for (final entry in raw.entries) {
    final node = entry.value;
    if (node is! Map<String, dynamic>) continue;
    final type = node['type'];
    final location = node['in'];
    if (type == 'http' && (node['scheme'] as String?)?.toLowerCase() == 'bearer') {
      result.add(HttpBearerScheme(entry.key));
    } else if (type == 'apiKey' && location == 'header') {
      result.add(ApiKeyHeaderScheme(entry.key, node['name'] is String ? node['name'] as String : entry.key));
    } else if (type == 'apiKey' && location == 'cookie') {
      result.add(ApiKeyCookieScheme(entry.key, node['name'] is String ? node['name'] as String : entry.key));
    }
  }
  result.sort((a, b) => a.name.compareTo(b.name));
  return result;
}

// ───────────────────────────── ordering ────────────────────────────────────

/// Order declarations so every type appears after the named types it depends
/// on (topological), breaking ties and cycles alphabetically by spec name.
///
/// A stable order makes the emitted part-directive list and any forward-
/// reference-sensitive output byte-deterministic. Cycles (mutually-recursive
/// DTOs are common) are broken by alphabetical entry order.
List<NamedType> _topoAlphaOrder(List<NamedType> declarations) {
  final byName = {for (final d in declarations) d.meta.specName: d};

  // Sources sorted alphabetically so the DFS visits in a stable order.
  final sorted = [...declarations]..sort((a, b) => a.meta.specName.compareTo(b.meta.specName));

  final visited = <String>{};
  final onStack = <String>{};
  final result = <NamedType>[];

  void visit(NamedType decl) {
    final name = decl.meta.specName;
    if (!visited.add(name)) return;
    onStack.add(name);

    final deps = _directDeps(decl).toList()..sort();
    for (final dep in deps) {
      final target = byName[dep];
      // Skip self-edges and back-edges (cycles): they cannot be honored, and
      // the alphabetical source order keeps the break deterministic.
      if (target != null && dep != name && !onStack.contains(dep)) {
        visit(target);
      }
    }

    onStack.remove(name);
    result.add(decl);
  }

  for (final decl in sorted) {
    visit(decl);
  }
  return result;
}

/// The set of named-type spec names [decl] directly references.
Set<String> _directDeps(NamedType decl) {
  final deps = <String>{};
  switch (decl) {
    case ObjectType():
      for (final prop in decl.properties) {
        _collectRefs(prop.type, deps);
      }
      if (decl.additional?.valueType case final t?) _collectRefs(t, deps);
    case UnionType():
      for (final v in decl.variants) {
        deps.add(v.specName);
      }
    case AliasType():
      deps.add(decl.target.specName);
    case EnumType():
      break;
  }
  return deps;
}

void _collectRefs(TypeModel t, Set<String> into) {
  switch (t) {
    case RefType():
      into.add(t.specName);
    case ArrayType():
      _collectRefs(t.items, into);
    case MapType():
      if (t.valueType case final v?) _collectRefs(v, into);
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
