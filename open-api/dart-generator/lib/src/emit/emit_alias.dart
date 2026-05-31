/// Emits an [AliasType] as a Dart `typedef`.
///
/// A bare-`$ref` schema (e.g. `LicenseResponseDto` → `UserLicense`) carries no
/// new shape of its own; it is simply another name for an existing declaration.
/// The idiomatic Dart for that is a non-generic type alias.
library;

import 'package:code_builder/code_builder.dart';

import '../ir/types.dart';

/// Builds `typedef <dartName> = <targetDartName>;` for [alias].
///
/// Assumes name resolution has run: [AliasType.meta]'s `dartName` and the
/// target [RefType]'s `dartName` are both populated.
TypeDef emitAlias(AliasType alias) {
  final target = alias.target.dartName ?? alias.target.specName;
  return TypeDef(
    (b) => b
      ..name = alias.meta.dartName
      ..docs.addAll(_docs(alias))
      ..definition = refer(target),
  );
}

List<String> _docs(AliasType alias) {
  final description = alias.meta.description;
  if (description == null || description.trim().isEmpty) return const [];
  return description
      .trimRight()
      .split('\n')
      .map((line) => '/// ${line.trimRight()}')
      .toList(growable: false);
}
