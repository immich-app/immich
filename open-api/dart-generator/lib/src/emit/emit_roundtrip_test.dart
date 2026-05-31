/// Emits `test/roundtrip_test.dart` into the generated client.
///
/// For each object DTO it synthesizes a representative JSON fixture from the
/// IR, then asserts the round-trip invariant:
///
///   once  = Foo.fromJson(fixture).toJson()   // normalized wire form
///   twice = Foo.fromJson(once).toJson()
///   expect(twice, once)                      // toJson∘fromJson is idempotent
///
/// Comparing serialized maps (not objects) tests the real data-preservation
/// property and avoids DateTime's UTC-vs-local equality pitfall.
library;

import 'dart:convert';

import '../ir/types.dart';

/// Sentinel: this type cannot be represented as a JSON fixture value
/// (binary, unknown, or a required reference cycle).
const Object _unsat = Object();

String emitRoundtripTest(IrDocument doc, GeneratorOptions options) {
  final synth = _FixtureSynth(doc);
  final buf = StringBuffer()
    ..writeln('// AUTO-GENERATED FILE, DO NOT MODIFY!')
    ..writeln('//')
    ..writeln('// Round-trip serialization tests: toJson(fromJson(x)) is idempotent.')
    ..writeln("import 'dart:convert';")
    ..writeln()
    ..writeln("import 'package:flutter_test/flutter_test.dart';")
    ..writeln("import 'package:${options.packageName}/api.dart';")
    ..writeln()
    ..writeln('void main() {');

  final skipped = <String>[];

  buf.writeln("  group('model round-trip', () {");
  for (final type in doc.declarations.whereType<ObjectType>()) {
    final fixture = synth.objectFixture(type);
    if (fixture == null) {
      skipped.add(type.meta.dartName);
      continue;
    }
    final name = type.meta.dartName;
    final encoded = const JsonEncoder().convert(fixture);
    buf
      ..writeln("    test('$name', () {")
      ..writeln("      final fixture = jsonDecode(r'''$encoded''') as Map<String, dynamic>;")
      ..writeln('      final once = $name.fromJson(fixture)!.toJson();')
      ..writeln('      final twice = $name.fromJson(once)!.toJson();')
      ..writeln('      expect(twice, once);')
      ..writeln('    });');
  }
  buf.writeln('  });');

  buf.writeln("  group('enum round-trip', () {");
  for (final type in doc.declarations.whereType<EnumType>()) {
    final member = type.members.firstWhere(
      (m) => m.dartName != 'valueUnknown',
      orElse: () => type.members.first,
    );
    final name = type.meta.dartName;
    final wireLit = member.wireValue is String ? "r'${member.wireValue}'" : '${member.wireValue}';
    buf
      ..writeln("    test('$name', () {")
      ..writeln('      final a = $name.fromJson($wireLit)!;')
      ..writeln('      expect($name.fromJson(a.toJson()), a);')
      ..writeln('    });');
  }
  buf.writeln('  });');

  buf.writeln('}');

  if (skipped.isNotEmpty) {
    buf
      ..writeln()
      ..writeln('// Not covered (no synthesizable fixture — required cycle, binary, or')
      ..writeln('// unknown field type): ${skipped.join(', ')}');
  }
  return buf.toString();
}

/// Builds JSON fixtures by recursing the resolved IR. Required reference cycles
/// make an object unsynthesizable (returns null); optional cyclic/unsynthesizable
/// fields are simply omitted.
class _FixtureSynth {
  final Map<String, NamedType> _byName;

  _FixtureSynth(IrDocument doc)
      : _byName = {for (final d in doc.declarations) d.meta.specName: d};

  Map<String, Object?>? objectFixture(ObjectType type) => _object(type, const {});

  Map<String, Object?>? _object(ObjectType type, Set<String> stack) {
    if (stack.contains(type.meta.specName)) return null; // cycle
    final next = {...stack, type.meta.specName};
    final map = <String, Object?>{};
    for (final prop in type.properties) {
      if (prop.forcedRaw == ForcedRaw.freeform) {
        map[prop.wireName] = {'sample': 'value'};
        continue;
      }
      final value = _value(prop.type, next);
      if (identical(value, _unsat)) {
        // Cannot satisfy a required, non-nullable field → whole DTO unsynthesizable.
        if (prop.required && !prop.nullable) return null;
        continue; // optional/nullable → omit
      }
      map[prop.wireName] = value;
    }
    return map;
  }

  Object? _value(TypeModel t, Set<String> stack) {
    switch (t) {
      case PrimitiveType(:final primitive):
        return switch (primitive) {
          PrimitiveKind.string => 'sample',
          PrimitiveKind.integer => 1,
          PrimitiveKind.float => 1.5,
          PrimitiveKind.number => 1.5,
          PrimitiveKind.boolean => true,
          PrimitiveKind.dateTime => '2020-01-02T03:04:05.000Z',
          PrimitiveKind.date => '2020-01-02',
          PrimitiveKind.object => 'sample',
        };
      case EnumType():
        final m = t.members.firstWhere(
          (m) => m.dartName != 'valueUnknown',
          orElse: () => t.members.first,
        );
        return m.wireValue;
      case ObjectType():
        return _object(t, stack) ?? _unsat;
      case AliasType():
        return _value(t.target, stack);
      case RefType(:final specName):
        final target = _byName[specName];
        return target == null ? _unsat : _value(target, stack);
      case ArrayType(:final items):
        final v = _value(items, stack);
        return identical(v, _unsat) ? <Object?>[] : [v];
      case MapType(:final valueType):
        final v = valueType == null ? 'value' : _value(valueType, stack);
        return {'key': identical(v, _unsat) ? null : v};
      case FreeFormType():
        return {'sample': 'value'};
      case UnionType():
        return t.variants.isEmpty ? _unsat : _value(t.variants.first, stack);
      case BinaryType():
        return _unsat;
      case UnknownType():
        return _unsat;
    }
  }
}
