// Throwaway smoke test: build small IR, render via emitters, print output.
import 'package:code_builder/code_builder.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_alias.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_context.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_enum.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_model.dart';
import 'package:immich_dart_openapi_generator/src/ir/types.dart';

const opts = GeneratorOptions(specPath: 's', outDir: 'o');

void main() {
  final ctx = EmitContext(opts);

  // ── Enum (string-backed) ──
  final assetType = EnumType(
    meta: NamedMeta(specName: 'AssetTypeEnum', dartName: 'AssetTypeEnum', description: 'Asset type'),
    backing: EnumBacking.string,
    members: [
      EnumMember(wireValue: 'IMAGE', dartName: 'image'),
      EnumMember(wireValue: 'VIDEO', dartName: 'video'),
    ],
  );

  // ── Enum referenced by a default ──
  final roleRef = RefType('AlbumUserRole', dartName: 'AlbumUserRole');

  // ── Model with the full matrix + collections + enum default ──
  final model = ObjectType(
    meta: NamedMeta(specName: 'SampleDto', dartName: 'SampleDto', description: 'A sample.'),
    properties: [
      Property(wireName: 'id', dartName: 'id', type: PrimitiveType(PrimitiveKind.string), required: true, nullable: false),
      Property(wireName: 'note', dartName: 'note', type: PrimitiveType(PrimitiveKind.string), required: true, nullable: true),
      Property(
        wireName: 'count',
        dartName: 'count',
        type: PrimitiveType(PrimitiveKind.integer),
        required: false,
        nullable: false,
        defaultValue: const NumberDefault(0),
      ),
      Property(wireName: 'maybe', dartName: 'maybe', type: PrimitiveType(PrimitiveKind.boolean), required: false, nullable: true),
      Property(
        wireName: 'ratio',
        dartName: 'ratio',
        type: PrimitiveType(PrimitiveKind.float),
        required: true,
        nullable: false,
      ),
      Property(
        wireName: 'tags',
        dartName: 'tags',
        type: ArrayType(PrimitiveType(PrimitiveKind.string), unique: false),
        required: true,
        nullable: false,
      ),
      Property(
        wireName: 'ids',
        dartName: 'ids',
        type: ArrayType(PrimitiveType(PrimitiveKind.string), itemsNullable: true, unique: true),
        required: false,
        nullable: true,
      ),
      Property(
        wireName: 'when',
        dartName: 'when',
        type: PrimitiveType(PrimitiveKind.dateTime),
        required: false,
        nullable: true,
      ),
      Property(
        wireName: 'role',
        dartName: 'role',
        type: roleRef,
        required: false,
        nullable: false,
        defaultValue: EnumDefault(roleRef, 'editor'),
      ),
      Property(
        wireName: 'parameters',
        dartName: 'parameters',
        type: FreeFormType(),
        required: false,
        nullable: true,
        forcedRaw: ForcedRaw.freeform,
      ),
    ],
    additional: const AdditionalProps(valueType: null),
  );

  // ── Alias ──
  final alias = AliasType(
    meta: NamedMeta(specName: 'LicenseResponseDto', dartName: 'LicenseResponseDto'),
    target: RefType('UserLicense', dartName: 'UserLicense'),
  );

  // ── Empty model (no fields) ──
  final empty = ObjectType(
    meta: NamedMeta(specName: 'EmptyDto', dartName: 'EmptyDto'),
    properties: const [],
  );

  // ── Model with only required-non-null fields (no _undefined needed) ──
  final allRequired = ObjectType(
    meta: NamedMeta(specName: 'PairDto', dartName: 'PairDto'),
    properties: [
      Property(wireName: 'a', dartName: 'a', type: PrimitiveType(PrimitiveKind.string), required: true, nullable: false),
      Property(wireName: 'b', dartName: 'b', type: PrimitiveType(PrimitiveKind.integer), required: true, nullable: false),
    ],
  );

  // ── Int-backed, non-tolerant enum ──
  final intEnum = EnumType(
    meta: NamedMeta(specName: 'PriorityEnum', dartName: 'PriorityEnum'),
    backing: EnumBacking.integer,
    members: [
      EnumMember(wireValue: 1, dartName: 'low'),
      EnumMember(wireValue: 2, dartName: 'high'),
    ],
  );
  const intactOpts = GeneratorOptions(
    specPath: 's',
    outDir: 'o',
    tolerantEnums: false,
    emitCompatHook: false,
  );

  // ── Model with typed-value additionalProperties ──
  final typedMap = ObjectType(
    meta: NamedMeta(specName: 'ConfigDto', dartName: 'ConfigDto'),
    properties: [
      Property(wireName: 'name', dartName: 'name', type: PrimitiveType(PrimitiveKind.string), required: true, nullable: false),
    ],
    additional: AdditionalProps(valueType: PrimitiveType(PrimitiveKind.integer)),
  );

  final out = StringBuffer();
  out.writeln(ctx.render(emitEnum(assetType, opts) as Spec));
  out.writeln(ctx.render(emitEnum(intEnum, intactOpts) as Spec));
  out.writeln(ctx.render(emitModel(model, opts) as Spec));
  out.writeln(ctx.render(emitModel(empty, opts) as Spec));
  out.writeln(ctx.render(emitModel(allRequired, opts) as Spec));
  out.writeln(ctx.render(emitModel(typedMap, intactOpts) as Spec));
  out.writeln(ctx.render(emitAlias(alias) as Spec));
  print(out);
}
