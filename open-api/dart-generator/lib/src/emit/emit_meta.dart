/// Builds server-version metadata as `static const` fields that are INLINED
/// into the type they describe (the model class, enum, sealed union base, or
/// `*Api` class) rather than emitted as a separate `*Meta` class.
///
/// For a DTO field annotated with `x-immich-history`, the model class gets:
///
/// ```dart
/// static const ApiVersion isEditedAddedIn = .new(2, 5, 0);
/// static const String isEditedState = 'beta';
/// ```
///
/// so business logic gates by server version inline on the type:
/// `if (ApiVersion.parse(server.version) >= AssetResponseDto.isEditedAddedIn)`.
///
/// Members are namespaced by the field/member/operation `dartName` (type-level
/// facts use the bare `addedIn`/`deprecatedIn`/`state`); for objects only
/// per-property facts occur in this spec, so the suffixed names never collide
/// with instance fields.
library;

import 'package:code_builder/code_builder.dart';

import '../ir/types.dart';

/// Static-const version-metadata fields to inline into [decl]'s declaration
/// (type-level facts + per-property facts for objects). Empty when [decl] has
/// no version metadata.
List<Field> declarationVersionFields(NamedType decl) {
  final fields = <Field>[];
  _addVersionFields(fields, decl.meta.versionMeta, prefix: '');

  if (decl is ObjectType) {
    for (final prop in decl.properties) {
      _addVersionFields(fields, prop.versionMeta, prefix: prop.dartName);
    }
  }
  return fields;
}

/// Static-const version-metadata fields to inline into an operation's `*Api`
/// class, namespaced by the operation [op]'s `dartName` (e.g.
/// `getActivitiesAddedIn`). Empty when none apply.
List<Field> operationVersionFields(OperationModel op) {
  final fields = <Field>[];
  _addVersionFields(fields, op.versionMeta, prefix: op.dartName);
  return fields;
}

// ── deprecation / since (schema-driven) ─────────────────────────────────────

/// The `@Deprecated(...)` message for a versioned member, or null when it is
/// not deprecated. A member is deprecated when the spec marks it `deprecated`,
/// its lifecycle state is `deprecated`, or it has a `deprecatedIn` version.
String? deprecationMessage(VersionMeta? meta, {bool specDeprecated = false}) {
  final deprecated =
      specDeprecated || meta?.state == LifecycleState.deprecated || meta?.deprecatedIn != null;
  if (!deprecated) return null;
  final since = meta?.deprecatedIn;
  return since != null
      ? 'Deprecated by the Immich server API since v$since.'
      : 'Deprecated by the Immich server API.';
}

/// A `@since`-style dartdoc line for a versioned member, or empty.
List<String> sinceDocLines(VersionMeta? meta) {
  final added = meta?.addedIn;
  return added != null ? ['Available since server v$added.'] : const [];
}

// ── builders ────────────────────────────────────────────────────────────────

/// Append `addedIn` / `deprecatedIn` / `state` consts for [meta], if present.
void _addVersionFields(List<Field> out, VersionMeta? meta, {required String prefix}) {
  if (meta == null) return;

  final addedIn = meta.addedIn;
  if (addedIn != null) {
    out.add(_versionConst(_member(prefix, 'addedIn'), addedIn));
  }

  final deprecatedIn = meta.deprecatedIn;
  if (deprecatedIn != null) {
    out.add(_versionConst(_member(prefix, 'deprecatedIn'), deprecatedIn));
  }

  final state = meta.state;
  if (state != null) {
    out.add(_stateConst(_member(prefix, 'state'), state));
  }
}

/// `<prefix><Suffix>` (camelCase) or bare `<suffix>` when [prefix] is empty.
String _member(String prefix, String suffix) {
  if (prefix.isEmpty) return suffix;
  return '$prefix${suffix[0].toUpperCase()}${suffix.substring(1)}';
}

Field _versionConst(String name, SemVerLit v) => Field(
      (b) => b
        ..name = name
        ..static = true
        ..modifier = FieldModifier.constant
        ..type = refer('ApiVersion')
        // Dot-shorthand: the field's declared type infers `ApiVersion`.
        ..assignment = Code('.new(${v.major}, ${v.minor}, ${v.patch})'),
    );

Field _stateConst(String name, LifecycleState state) => Field(
      (b) => b
        ..name = name
        ..static = true
        ..modifier = FieldModifier.constant
        ..type = refer('ApiState')
        // Dot-shorthand enum value; `state.name` matches an `ApiState` member.
        ..assignment = Code('.${state.name}'),
    );

