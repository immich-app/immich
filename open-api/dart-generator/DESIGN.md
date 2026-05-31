> **Status note (2026-05-30):** Sections 1–9 below are the original synthesized design. Two decisions OVERRIDE the migration phasing in §1/§5/§8:
> 1. **Idiomatic-first (direct)** — emit modern Dart immediately (immutable `final class`, `sealed` unions wired into fields, `valueUnknown` enum tolerance, non-null returns where safe). NO parity-vs-old harness. Validate via round-trip + `dart analyze` + app compiles + `flutter test`.
> 2. **Server-version metadata from the start** — first-class in IR + emitters, derived from `x-immich-history`/`x-immich-state`/`x-immich-permission`, emitted as `const SemVer` literals reusing the app's `SemVer`/`Option`.
>
> Still preserved (live infra, not upstream-matching): `abortTrigger` + forked `http`, `compute()` isolate decode, backward-compat default injection.

# Immich TS→Dart OpenAPI Generator — Unified Design

## 1. Goal & scope

Replace the OpenAPI-Generator-v7 + mustache-patch + post-gen-`.patch` toolchain that currently produces `mobile/openapi/` with a purpose-built TypeScript generator that reads `open-api/immich-openapi-specs.json` (OpenAPI 3.0.0, 359 schemas, 243 operations) and emits the Dart `package:openapi/api.dart` client programmatically. The generator must be a **behavior-preserving drop-in** at cutover: it reproduces every must-preserve behavior the live mobile app depends on (the `upgradeDto` compat hook, isolate JSON decode, `abortTrigger` plumbing, mutable `ApiClient.basePath`/`client`, `Future<T?>` returns, `ApiException(int,String)`, the `AssetEditActionItemDto.parameters` raw-map special case, etc.), eliminates all 6 patch/template files by baking their behavior into emitters and a verbatim-copied `runtime/` directory, and moves the model layer to modern Dart (`final class`, immutable, manual equality, `copyWith`) only in a later, separately-revertable phase. Ergonomic wins (non-null returns, sealed unions wired into fields, enum `valueUnknown` tolerance applied to app switches) are explicitly deferred to post-cutover phases.

## 2. High-level architecture

A strict three-stage pipeline. **After `buildIr`, no code reads the raw OpenAPI document** — the emitter consumes only the IR. This is the architectural pivot that lets every Finding-1 edge case be solved once, in the normalizer, instead of being smeared across templates and patches.

```
spec.json
   │
   ▼
┌─────────┐   loader/        read + assert openapi == 3.0.x; index $refs
│  LOAD   │ ───────────────▶ (ref identity PRESERVED — no full deref)
└─────────┘
   │  Document + refIndex
   ▼
┌──────────────┐  ir/builder    schema → TypeModel ; pathItem → OperationModel
│  NORMALIZE   │ ─────────────▶ allOf flatten/collapse, anyOf→Union, tri-state,
│   (→ IR)     │                inline-array synthesis, override table
└──────────────┘
   │  IrDocument (unnamed dartName slots)
   ▼
┌──────────────┐  ir/resolve-names   collision-free Pascal/camel/snake;
│ RESOLVE NAMES│ ──────────────────▶ topo+alpha order; fill RefType.dartName
└──────────────┘
   │  IrDocument (fully named, stable order)
   ▼
┌─────────┐   emit/*        per-artifact emitters via one CodeWriter;
│  EMIT   │ ──────────────▶ copy runtime/ verbatim; write part/part of tree
└─────────┘
   │
   ▼
mobile/openapi/**  (single library openapi.api; byte-deterministic)
```

Stage boundaries are enforced by TS types: the IR is a closed discriminated union, so every emitter `switch (t.kind)` is exhaustiveness-checked with a `never` default — the generator's own compile-time analog of the Dart `sealed` exhaustiveness it produces.

## 3. Repo layout & dependencies

Lives beside the existing TS SDK build, under `open-api/`. The build script becomes a thin shim that runs the generator.

```
open-api/
  bin/
    generate-dart-sdk.sh         # REWRITTEN: cd dart-generator && npm run gen
  dart-generator/                # NEW
    package.json
    tsconfig.json
    src/
      index.ts                   # CLI: argv → run(opts)
      pipeline.ts                # load → index → buildIr → resolveNames → emit
      loader/
        load-spec.ts             # read JSON; assert openapi 3.0.x
        index-refs.ts            # Map<specName, rawSchemaNode>, ref identity kept
      ir/
        types.ts                 # ALL IR definitions (§4) — THE shared contract
        builder.ts               # Document → IrDocument
        schema-walker.ts         # schema node → TypeModel
        operation-walker.ts      # path item → OperationModel
        overrides.ts             # (specName, propName) → forced type (AssetEdit…)
        name-registry.ts         # collision-free identifier allocation
        resolve-names.ts         # assign dartName/fileName onto IR
      emit/
        code-writer.ts           # indentation buffer (§ shared util)
        dart-naming.ts           # pure snake/Pascal/camel + enum-value sanitizer
        emit-enum.ts
        emit-model.ts            # ObjectType → final class
        emit-union.ts            # UnionType → sealed hierarchy
        emit-alias.ts            # AliasType → typedef
        emit-api.ts              # ApiModel → XxxApi
        emit-api-defaults.ts     # ApiDefaults registry (spec-derived defaults)
        emit-library.ts          # api.dart: library + part directives + imports
        runtime/                 # STATIC, copied verbatim — never generated
          api_client.dart
          api_exception.dart
          api_helper.dart
          serialization.dart
          auth/*.dart
          pubspec.fragment.yaml  # immich_mobile path dep + forked http ^1.6.0
      util/
        topo-sort.ts
        deterministic.ts
    test/
      *.test.ts                  # node:test via `tsx --test`
      fixtures/                  # mini specs, one per Finding-1 edge case
```

`package.json` (lean — one runtime dep):

```json
{
  "name": "@immich/dart-openapi-generator",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "gen": "node ./dist/index.js --spec ../immich-openapi-specs.json --out ../../mobile/openapi",
    "gen:dev": "tsx src/index.ts --spec ../immich-openapi-specs.json --out ../../mobile/openapi",
    "test": "tsx --test test/**/*.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@apidevtools/json-schema-ref-parser": "^11.7.0" },
  "devDependencies": { "typescript": "^5.6.0", "tsx": "^4.19.0", "@types/node": "^20.16.0" }
}
```

**Decision (ref handling):** use `@apidevtools/json-schema-ref-parser` only for JSON-Pointer parsing and defensive cycle detection; do **not** fully dereference. We build `Map<specName, rawSchemaNode>` ourselves and emit `RefType{specName}` so named types stay named (full deref would inline-expand DTOs and destroy the class boundary). No mustache/handlebars — Dart is emitted programmatically through `CodeWriter`. Test runner is Node built-in `node:test`; zero extra deps.

## 4. The IR — finalized TS type definitions

Component A's IR is adopted essentially whole (it is the most complete and the only one that models operations, security, multipart, and the override seam). Component B's emission decisions are layered on top as IR flags where needed. This is the single coherent set; `src/ir/types.ts`.

```ts
// ───────────────────────── Root ─────────────────────────
export interface IrDocument {
  readonly declarations: readonly Declaration[];   // topo+alpha stable order
  readonly apis: readonly ApiModel[];              // tags sorted alpha
  readonly security: readonly SecurityScheme[];
  readonly info: { title: string; version: string; openApiVersion: string };
}

export type Declaration =
  | { kind: 'object'; type: ObjectType }
  | { kind: 'enum';   type: EnumType }
  | { kind: 'union';  type: UnionType }
  | { kind: 'alias';  type: AliasType };

// ───────────────────────── Type model ─────────────────────────
export type TypeModel =
  | PrimitiveType | EnumType | ObjectType | UnionType | ArrayType
  | MapType | RefType | AliasType | BinaryType | FreeFormType | UnknownType;

export interface NamedTypeMeta {
  readonly specName: string;
  dartName: string;          // set by resolveNames
  fileName: string;          // set by resolveNames (snake_case, no ext)
  readonly description?: string;
  readonly deprecated: boolean;
}

export type PrimitiveKind =
  | 'string' | 'int' | 'double' | 'num' | 'bool'
  | 'dateTime' | 'date' | 'object';

export interface PrimitiveType {
  readonly kind: 'primitive';
  readonly primitive: PrimitiveKind;
  readonly constraints?: ScalarConstraints; // RETAINED, never affects the Dart type
  readonly numberAmbiguous?: boolean;        // bare `number` → default double
}
export interface ScalarConstraints {
  readonly pattern?: string; readonly minimum?: number; readonly maximum?: number;
  readonly minLength?: number; readonly maxLength?: number; readonly format?: string;
}

export interface EnumType extends NamedTypeMeta {
  readonly kind: 'enum';
  readonly backing: 'string' | 'int';
  readonly members: readonly EnumMember[];
}
export interface EnumMember {
  readonly wireValue: string | number;  // exact wire value, preserved
  dartName: string;                      // sanitized identifier (see §5.2 decision)
}

export interface ObjectType extends NamedTypeMeta {
  readonly kind: 'object';
  readonly properties: readonly Property[]; // allOf already merged; spec order
  readonly additional?: AdditionalProps;
  readonly isMultipart: boolean;
}
export interface Property {
  readonly wireName: string;
  dartName: string;
  readonly type: TypeModel;
  readonly required: boolean;   // ── these three are INDEPENDENT;
  readonly nullable: boolean;   //    never collapse nullable⇒optional
  readonly default?: DefaultValue;
  readonly description?: string;
  readonly deprecated: boolean;
  /** Set by overrides.ts; emitter forces this raw type & passthrough ser/deser. */
  readonly forcedRaw?: 'freeform';   // AssetEditActionItemDto.parameters
}

export type DefaultValue =
  | { kind: 'null' }
  | { kind: 'bool'; value: boolean }
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'enum'; enumRef: RefType; enumMemberWire: string | number };

export interface AdditionalProps { readonly valueType: TypeModel | null; readonly nullable: boolean; }

export interface ArrayType {
  readonly kind: 'array';
  readonly items: TypeModel;
  readonly itemsNullable: boolean;  // List<T?> independent of array nullability
  readonly unique: boolean;         // uniqueItems → Set<T>
  readonly minItems?: number; readonly maxItems?: number;
}

export interface MapType {
  readonly kind: 'map';
  readonly valueType: TypeModel | null; // null ⇒ Map<String,dynamic>
  readonly valueNullable: boolean;
}

export interface RefType { readonly kind: 'ref'; readonly specName: string; dartName?: string; }
export interface AliasType extends NamedTypeMeta { readonly kind: 'alias'; readonly target: RefType; }

export interface UnionType extends NamedTypeMeta {
  readonly kind: 'union';
  readonly composition: 'oneOf' | 'anyOf';
  readonly variants: readonly RefType[];
  readonly discriminator: Discriminator | null;
}
export interface Discriminator { readonly propertyName: string; readonly mapping: ReadonlyMap<string, RefType>; }

export interface BinaryType { readonly kind: 'binary'; readonly role: 'upload' | 'download'; }
export interface FreeFormType { readonly kind: 'freeform'; }
export interface UnknownType { readonly kind: 'unknown'; readonly reason: string; }

// ───────────────────────── Operations ─────────────────────────
export interface ApiModel { dartName: string; fileName: string; readonly tag: string; readonly operations: readonly OperationModel[]; }

export interface OperationModel {
  dartName: string;
  readonly operationId: string;
  readonly httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly deprecated: boolean;
  readonly description?: string;
  readonly pathParams: readonly Param[];
  readonly queryParams: readonly Param[];
  readonly headerParams: readonly Param[];   // x-immich-checksum
  readonly body: RequestBody | null;
  readonly responses: readonly ResponseModel[];
  readonly successResponse: ResponseModel;
  readonly security: readonly SecurityRequirement[];
}
export interface Param {
  readonly wireName: string; dartName: string; readonly type: TypeModel;
  readonly required: boolean; readonly nullable: boolean; readonly default?: DefaultValue;
  readonly description?: string;
  readonly style?: 'form' | 'spaceDelimited' | 'pipeDelimited'; // default form
  readonly explode?: boolean;                                   // default true ⇒ multi
}
export interface RequestBody { readonly required: boolean; readonly content: BodyContent; }
export type BodyContent =
  | { kind: 'json'; type: TypeModel }
  | { kind: 'multipart'; type: RefType; parts: readonly MultipartPart[] }
  | { kind: 'urlencoded'; type: TypeModel };
export interface MultipartPart { readonly wireName: string; readonly type: TypeModel; readonly required: boolean; }
export interface ResponseModel {
  readonly statusCode: number;
  readonly type: TypeModel | null;          // null ⇒ void; BinaryType{download} ⇒ bytes; ArrayType ⇒ inline list
  readonly contentType: 'application/json' | 'application/octet-stream' | null;
}

export type SecurityScheme =
  | { name: string; kind: 'http-bearer' }
  | { name: string; kind: 'apiKey-header'; headerName: string }
  | { name: string; kind: 'apiKey-cookie'; cookieName: string };
export interface SecurityRequirement { readonly schemeName: string; readonly scopes: readonly string[]; }
```

**Resolved disagreement:** Component B floated a `$unknownFields` retention field on objects; Component A did not model it. **Call: omit it from the IR entirely for now** (it complicates `==`, the app doesn't need round-trip fidelity, and Finding 4 itself marks it flag-gated/off). If ever needed it becomes a single `GeneratorOptions.retainUnknownFields` flag with a per-object `Map<String,dynamic>` field added at emit time only — no IR change required.

`GeneratorOptions`:

```ts
export interface GeneratorOptions {
  specPath: string; outDir: string;
  packageName: string;            // 'openapi'
  emitUpgradeHook: boolean;       // true — emit ApiDefaults.apply (see §5.1.6 decision)
  emitAbortTrigger: boolean;      // true
  isolateThresholdBytes: number;  // 8192 (used only if compute→Isolate.run migration taken)
  emitTypedIds: boolean;          // false
  retainUnknownFields: boolean;   // false
}
```

## 5. Emission strategy per construct

Library shape unchanged: single `library openapi.api;` stitched by `part`/`part of`, imported as `package:openapi/api.dart`, all shared imports in `api.dart`.

**Banner (every file):**
```dart
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=3.3
part of openapi.api;
```
**Decision (language version):** raise `// @dart=2.18` → `// @dart=3.3`. The old patched output used `2.18`; we emit `final class`, `sealed`, and exhaustive `switch` expressions, which require 3.x. `api.dart` itself uses `library openapi.api;` + imports instead of `part of`. No `analysis_options.yaml` is ever written into the tree.

### 5.1 DTO model class

**Immutability — DECISION: `final class`, all fields `final`, `const` ctor when all defaults are const.** Finding 3 verified zero DTO field-mutation sites in the app, so this is non-breaking. *However*, per the migration plan this lands in **Phase 4**, not at cutover — at cutover the generator emits the current mutable shape to keep Phase 2 a pure behavioral drop-in. The generator carries both behind no flag change other than the phase it ships in; the immutable emission is the end-state shown here.

Emitted shape (end-state), with the tri-state nullability matrix:

| required | nullable | field | ctor param | fromJson read |
|---|---|---|---|---|
| ✓ | ✗ | `final T x;` | `required this.x` | `x: <coerce>(json[k])!` |
| ✓ | ✓ | `final T? x;` | `required this.x` | `x: <coerce>(json[k])` |
| ✗ | ✗ (default) | `final T x;` | `this.x = <default>` | `x: <coerce>(json[k]) ?? <default>` |
| ✗ | ✓ | `final T? x;` | `this.x` | `x: <coerce>(json[k])` |

Mandatory behaviors baked in:

- **§5.1.1 `toJson` omits nulls** — nullable/optional-without-default fields wrap `if (this.f != null) { json[k] = ...; }`; never write `json[k] = null`. Required-non-null written unconditionally.
- **§5.1.2 double coercion** — `isDouble` fields read `(json[k] as num).toDouble()` (with `!`/`?`/`?? default` per matrix); **no** parallel generic numeric branch. Centralized via `_toDouble(Object?)`. The 15 bare `number` fields use the same path.
- **§5.1.3 nullable array items + Set** — `List<T?>` when `itemsNullable`; `Set<T>` when `unique` (deserialize `.toSet()`, serialize `.toList(growable:false)`). `TimeBucketAssetResponseDto` (`List<String?>`, `List<int?>`, the lone `List<List<...>?>`) is the explicit stress case. Equality uses `_deepEquality` (`const DeepCollectionEquality()`) for both List and Set.
- **§5.1.4 `copyWith`** — net-new (app uses none today, so additive), nullable fields use a private `_undefined` sentinel so `copyWith(f: null)` can clear.
- **§5.1.5 `fromJson` signature** — **DECISION: PRESERVE `static T? fromJson(dynamic value)`** (nullable return, `dynamic` param). Conflict: Finding 4 prefers `factory fromJson(Map)→T`. The app tears `SyncXxxV1.fromJson` off into `_kResponseMap` as `Function(Object)` and force-unwraps (`SyncEntityType.fromJson(...)!`). Keep an outer nullable static delegating to an inner `_fromMap`. Also keep `requiredKeys`, `listFromJson`, `mapFromJson`, `mapListFromJson` (cheap; removing breaks surface). No `requiredKeys` assert block.

**§5.1.6 The `upgradeDto` compat hook — DECISION: PRESERVE the verbatim call site at cutover; migrate to `ApiDefaults` only as an opt-in later phase.**

This is the single highest-risk coupling and the components disagreed. Component A says preserve `upgradeDto(value,"ClassName")` exactly (drop-in). Component B proposes replacing it with a generated `ApiDefaults` registry that kills the `openapi → immich_mobile` circular dependency. **Call: ship Phase 2 with the literal current contract** — every model `fromJson` begins:

```dart
static AssetResponseDto? fromJson(dynamic value) {
  upgradeDto(value, "AssetResponseDto");
  if (value is! Map<String, dynamic>) return null;
  ...
}
```
and `api.dart` keeps `import 'package:immich_mobile/utils/openapi_patching.dart';`. This is gated by `emitUpgradeHook` (default true) and guarantees behavioral parity with zero app-side changes. The `ApiDefaults` registry (Component B's design — spec-derived defaults table + app-registered runtime hooks, dropping the circular import) is the **preferred end-state and a Phase-4 migration**, done in lockstep with porting `openapi_patching.dart` (including flattening its intentional `switch` fall-through into per-type entries — verified against the actual file, not guessed) and changing the call site to `ApiDefaults.apply('ClassName', value)`. We do not take this risk at cutover. Rationale: Finding 2/3 both flag this as critical and "preserve as-is"; the circular dep is undesirable but not breaking, so it does not justify coupling the highest-risk change to the cutover.

- **§5.1.7 free-form `additionalProperties`** → `Map<String, dynamic>` (14 cases, several nullable); `fromJson` via `(json[k] as Map?)?.cast<String,dynamic>()`. No `Map.unmodifiable` wrap (avoids surprising `WorkflowStepDto.config` consumers). Typed-value maps → `Map<String,V>` (none today, modeled).
- **§5.1.8 bare `$ref` alias** (`LicenseResponseDto`) → `typedef LicenseResponseDto = UserLicense;`.

### 5.2 Enums — enhanced enum + tolerant `fromJson`

```dart
enum AssetTypeEnum {
  IMAGE._(r'IMAGE'), VIDEO._(r'VIDEO'), AUDIO._(r'AUDIO'), OTHER._(r'OTHER'),
  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');
  const AssetTypeEnum._(this.value);
  final String value;
  static AssetTypeEnum? fromJson(dynamic value) {
    for (final e in values) { if (e.value == value) return e; }
    return value == null ? null : valueUnknown;
  }
  Object toJson() => value;
  @override String toString() => value;
}
```

- **DECISION (member identifiers): PRESERVE current exact casing.** Conflict: Finding 4 wants lowerCamelCase. The app switches on `AssetTypeEnum.VIDEO`, `AssetVisibilityEnum.timeline`, `MemoryTypeEnum.onThisDay` (Finding 3 §7, ~40 switch arms). Emit member names matching whatever the current generator produces (`IMAGE` uppercase, `timeline` lowercase). The sanitizer (`dart-naming.ts`) applies **only** to wire values that aren't already valid identifiers — split on `.`/`-`/`_`/whitespace, lowerCamelCase the parts, prefix `n` on leading digit, `$N` suffix on collision (`activity.create`→`activityCreate`, `refresh-faces`→`refreshFaces`, `on_this_day`→`onThisDay`). Raw `wireValue` always preserved for ser/deser.
- **DECISION (`valueUnknown`): emit it** (tolerance is the correct forward-compat default; keeps decode total). This is a deliberate divergence from the old generator (which threw). The app's exhaustive switches must gain a `valueUnknown`/`_` arm — surfaced as **analyzer errors** (the "caught not silently broken" outcome Finding 3 endorses), fixed in the same PR. **Sequencing: defer to Phase 4**, after the parity job is retired (the old generator threw, so `valueUnknown` changes parity).
- **DECISION (transformer): drop `XxxTypeTransformer`.** It is internal-only (Finding 3 §7 confirms no app reliance); model `fromJson` calls `XxxEnum.fromJson` directly. `fromJson` stays `static Enum? fromJson(dynamic)`.
- Integer enums supported (`final int value;`, `entry._(1)`); none exist today.

### 5.3 Unions (oneOf / anyOf)

Emit a `sealed` base + `final class` leaf per variant. Discriminated → tagged `switch` on the discriminator property, `throw ApiException(0, 'Unknown ... discriminator: $other')` on unknown (reuse `ApiException`, no new type). Discriminator-less → structural try-each in spec order. The `Discriminator{propertyName, mapping}` node is the seam where a future spec `discriminator` plugs in with zero emitter change.

- **DECISION (`AssetEditActionItemDto.parameters`): PRESERVE raw `Map<String,dynamic>`.** This is the critical special case (Finding 2/3 §9 — the typed wrapper is "unusable for the mobile app"). Driven by the IR `Property.forcedRaw='freeform'` set by `overrides.ts` (the modern replacement for `asset_edit_action_item_dto.dart.patch`): emit `final Map<String, dynamic>? parameters;` with passthrough `parameters: json[r'parameters']` / direct write. The generator **still emits** the `AssetEditActionItemDtoParameters` sealed union type (registered, unused by this field) so the machinery exists and matches today's state.

### 5.4 allOf — flatten / collapse

The normalizer handles all composition; the emitter never sees `allOf`. Two paths:
- **(a) length-1 `allOf` as a property type + sibling `nullable`/`default`** (all 8 today) → property becomes nullable `RefType`; the two enum-via-allOf defaults (`AlbumUserAddDto.role='editor'`, `MetadataSearchDto.order='desc'`) become `Property.default = {kind:'enum',...}`, flowing into both the ctor default (`this.role = AlbumUserRole.editor`) and the `ApiDefaults`/`upgradeDto` default table.
- **(b) multi-member `allOf` as a schema body** → merge all members' properties into one flat `ObjectType` (later member wins on conflict; none today). Modeled now so a future base+subtype composition flattens with no code change.

### 5.5 API classes

- **DECISION (returns): PRESERVE `Future<T?>`** on high-level methods (11 repos wrap calls in `checkNull<T>(Future<T?>)`; `SyncEntityType.fromJson(...)!`). Tightening to non-null is an acceptable mechanical migration but touches ~70 sites — **defer to Phase 4, its own PR.**
- Emit **both** forms per op: `nicknameWithHttpInfo(...) → Future<Response>` and high-level `nickname(...) → Future<T?>`. Only `downloadAssetWithHttpInfo` is consumed directly (returns raw `Response` for streaming) — preserve.
- **Param shape:** positional path params first, then one brace block of all optional/query/body params **plus** `abortTrigger`. Even param-less ops emit `{ ..., Future<void>? abortTrigger, }`. All 106 request bodies are `required:true` → required params.
- **`abortTrigger` plumbing** (`emitAbortTrigger`, default true): threaded `nickname → nicknameWithHttpInfo → invokeAPI(..., abortTrigger:)`. `invokeAPI` builds `Abortable{,Streamed,Multipart}Request` (forked `package:http ^1.6.0`, mertalev fork, PRs #1876/#1877), `_client.send` + `Response.fromStream` for all verbs; the old `switch(method)` block and `'Invalid HTTP operation'` fallthrough are gone.
- **Multipart**: binary fields (`AssetMediaCreateDto.assetData/.sidecarData`, `CreateProfileImageDto.file`, `DatabaseBackupUploadDto.file`) → `MultipartFile`; mixed DTO scalars/date-times → `formParams` as strings; `uploadAsset.x-immich-checksum` → first-class header param.
- **Array query params** (4): OpenAPI 3.0 default `style:form, explode:true` = **multi** (`?k=a&k=b`); IR carries `style`/`explode` for future csv/pipes. `tagIds` nullable → omit when null.
- **Binary downloads** (7): high-level method returns bytes/`Response`, no deserialization. **204 ops** (48) → `Future<void>`, return `null`. **Deprecated ops** (3) → `@Deprecated('...')`.
- **DECISION (isolate decode): PRESERVE `compute()`** at cutover (`ApiClient.deserialize` async, `await compute((j)=>json.decode(j), value)`, `package:flutter/foundation.dart` import). The `Isolate.run` + size-threshold variant (Finding 4 §5) is internal-only (no app reliance) → optional Phase-4 follow-up. `deserializeAsync` stays public.

### 5.6 Runtime / support files (copied verbatim, not generated)

These eliminate all 4 post-gen `.patch` files. `runtime/api_client.dart` ships with mutable `String basePath` (default `/api`), `var _client = Client()` + `client` getter/setter, `addDefaultHeader`/`defaultHeaderMap`, async `deserialize`/`deserializeAsync`/`serializeAsync`, `invokeAPI(..., {abortTrigger})`, static `fromJson` type-switch, ctor `ApiClient({String basePath='/api', Authentication? authentication})`. `runtime/api_exception.dart` ships `ApiException(int code, [String? message])` + `.withInner`, `.code`/`.message`. `runtime/api_helper.dart` ships `QueryParam`, `_queryParams`, `parameterToString`, `_decodeBodyBytes`, `_dateTimeFromJson`, `_toDouble`, `_listOf<T>`, `_deepEquality`, `mapValueOfType<T>`. `runtime/auth/*` ships `Authentication`/`ApiKeyAuth`/`HttpBearerAuth`/`OAuth` — **DECISION: emit despite being app-unused** (part of the documented public surface; `ApiClient` ctor takes `Authentication?`; removing is a breaking ctor change). `pubspec.fragment.yaml` carries `immich_mobile: path: ../` + forked `http: ^1.6.0` + `cupertino_http`/`ok_http` git pins (replaces `pubspec_immich_mobile.yaml.patch`).

## 6. Must-preserve behaviors — checklist

The emitted output MUST satisfy all of these (each is verified by a generator unit test and/or the Dart validation suite §7):

1. Every model `fromJson` starts with `upgradeDto(value, "ClassName")` (before the `value is Map` check); `api.dart` imports `package:immich_mobile/utils/openapi_patching.dart`.
2. `ApiClient.deserialize` is `async`, decodes via `compute((j)=>json.decode(j), value)` on an isolate; `deserializeAsync` is a passthrough; `api.dart` imports `package:flutter/foundation.dart`.
3. `isDouble` fields read `num` then `.toDouble()`, no parallel numeric branch.
4. Array fields with nullable items emit `List<T?>`; `uniqueItems` emit `Set<T>` (`.toSet()` / `.toList(growable:false)`).
5. `ApiClient.basePath` mutable; `client` getter+setter; `addDefaultHeader`/`defaultHeaderMap` present; ctor default `'/api'`.
6. `fromJson` has no `requiredKeys` assert block; `requiredKeys` static const still emitted.
7. `toJson` omits null keys (never `json[k] = null`).
8. `abortTrigger` threaded through every op and `invokeAPI`; requests built via `Abortable*Request` + `_client.send`/`Response.fromStream`; param list reshaped (trailing brace block incl. `abortTrigger`).
9. Each of 21 `XxxApi` classes: `XxxApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient`, `.apiClient` getter, dual `nickname`/`nicknameWithHttpInfo` forms, `Future<T?>` high-level returns.
10. `downloadAssetWithHttpInfo(id, {edited})` returns `Future<Response>`.
11. Models/enums expose `static T? fromJson(dynamic)` (tear-off into `_kResponseMap`); enums expose `.values` + exact member identifiers.
12. `ApiException(int, [String?])` positional ctor, `.code`/`.message`, `.withInner`.
13. `AssetEditActionItemDto.parameters` is `Map<String,dynamic>?` with passthrough ser/deser; `AssetEditActionItemDtoParameters` union still emitted (unused).
14. `LicenseResponseDto` is `typedef LicenseResponseDto = UserLicense;`.
15. Single `library openapi.api;` via `part`/`part of`; no per-file imports; `// AUTO-GENERATED` + `// @dart=3.3` header on every file; no `analysis_options.yaml` in tree.
16. `pubspec.yaml`: `immich_mobile: path: ../`, forked `http: ^1.6.0` + platform-client git pins.
17. Tri-state required×nullable preserved (105 required-AND-nullable fields stay `required this.x` + `T?`).
18. 48 no-content ops → `Future<void>`/`null`; 7 octet-stream ops → bytes; 3 deprecated ops → `@Deprecated`.
19. Output is byte-deterministic across runs.

## 7. Validation & build integration

**Build wiring.** `[tasks.open-api-dart]` in `open-api/mise.toml` is repointed from `bash ./bin/generate-dart-sdk.sh` to building + running the TS generator (`node dist/index.js -i ./immich-openapi-specs.json -o ../mobile/openapi`), mirroring how `:open-api-typescript` depends on the SDK build. The umbrella `[tasks.open-api]` in root `mise.toml` is structurally unchanged — devs and CI keep running `mise //:open-api`. Upstream spec flow (`//server:sync-open-api` → `immich-openapi-specs.json`) is untouched; only the last consumer swaps.

**Five validation gates:**
1. **Round-trip property test** — generator emits `mobile/openapi/test/roundtrip_test.dart` with per-DTO synthetic max-fill builders (every optional present, nullable both ways, enums at each member, arrays incl. a null element, `TimeBucketAssetResponseDto` parallel arrays len 2) asserting `fromJson(toJson(x)) == x` and wire-preservation. Comparator compares numbers numerically (absorbs double coercion) and ignores null keys (absorbs null omission). Explicit fixtures for every Finding-1 edge case incl. the two allOf-enum-defaults, the anyOf raw-map field, free-form maps, dotted/hyphenated enums, and `valueUnknown` tolerance. A thin overlay harvests spec `example`s.
2. **Compile gate** — `dart analyze mobile/openapi` run **explicitly in isolation** via a transient `analysis_options.yaml` that does NOT exclude the tree (the host config excludes `openapi/**`); run after `mobile` deps resolve (the `openapi → immich_mobile` path dep must be present).
3. **App gate** — `cd mobile && dart analyze` + `flutter test` (enforces the entire Finding-3 source-compat contract via compiler + existing SDK-level mocks `MockSyncApi`/`MockApiClient.basePath` + repository mocks).
4. **Semantic parity (transition-only)** — generate old client into `mobile/openapi_old`, run golden wire-JSON fixtures (captured from a real dev server via e2e, falling back to spec examples + synthetic) through both, assert field-equal via normalized `toJson()`. Maintain a documented **divergence allowlist** (`valueUnknown` tolerance, any tightened nullability, the anyOf raw-map which should actually match). `upgradeDto` parity is non-negotiable: both clients run the hook; the 10-DTO default table gets dedicated new-field-omitted fixtures.
5. **CI wiring** — reuse the existing `generated-api-up-to-date` drift job unchanged (it runs `mise //:open-api` + `verify-changed-files` on `mobile/openapi`, `packages/sdk`, spec). **Add a determinism self-check**: run the generator twice and diff before the commit-diff check. Add `mobile-openapi-validate` (isolated analyze + round-trip test) and transition-only `mobile-openapi-parity`. `check-openapi.yml` (oasdiff) untouched.

## 8. Migration plan (phased)

Ordering principle: **prove drop-in parity first, ship that, then take ergonomic wins as separate revertable PRs.** Never combine "new generator" with "new API shape."

- **Phase 0 — Reach drop-in parity (branch, no repo changes).** Generator emits output matching the old client across all 359 schemas (parity suite green) and passing the app gate as a literal drop-in. Models stay **mutable**, returns stay `Future<T?>`, `upgradeDto(value,"Class")` hook + `immich_mobile` import preserved, `AssetEditActionItemDto` raw-map, abortable plumbing, `ApiException(int,String)` all preserved. Exit: parity + round-trip + isolated analyze + app gate green; generator runs twice → identical bytes.
- **Phase 1 — Shadow (CI-only).** Land the generator package + `open-api-dart-parity` task + `mobile-openapi-parity`/`mobile-openapi-validate` jobs. Do **not** switch `:open-api-dart`; new output goes to `mobile/openapi_new` in CI, diffed/parity-checked, not committed. Bake one release cycle; capture real server responses through parity fixtures.
- **Phase 2 — Cutover.** Flip `[tasks.open-api-dart]` to the new generator; commit regenerated `mobile/openapi`. Drift check now guards new output. Behavior-preserving → app gate passes with zero app changes. Keep `openapi_old` + parity one more cycle as safety net. **Rollback = revert one mise-task line + regenerate.**
- **Phase 3 — Retire old toolchain.** Delete `generate-dart-sdk.sh`, `templates/mobile/**` (mustache + `.patch`), `patch/**` (4 files), `openapi_old` + parity task/jobs/fixtures. **Keep `mobile/lib/utils/openapi_patching.dart`** (hand-maintained app code still called by `fromJson`).
- **Phase 4 — Ergonomic wins (each its own PR, individually revertable).** (a) Immutable models + `copyWith` (non-breaking, app gate confirms). (b) `upgradeDto` → `ApiDefaults` registry, porting the switch (flattening fall-through) and dropping the circular import. (c) Tighten returns to non-null + delete `checkNull`/`!`. (d) `valueUnknown` tolerance applied: add `_` arms to app exhaustive switches (only after parity job retired). (e) Optional `compute` → thresholded `Isolate.run`.

## 9. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `upgradeDto` hook dropped from any `fromJson` — silent backward-compat loss, runtime crash on old servers | Critical | Generator unit test asserts every emitted `fromJson` begins with `upgradeDto(value,"Class")`; parity fixtures with new-field-omitted variants for all 10 DTOs; keep `openapi_patching.dart` untouched; defer `ApiDefaults` migration to Phase 4 |
| 2 | Non-deterministic output flakes drift check | High | Generate-twice-and-diff CI step; topo+alpha schema order, spec-order properties, stable name allocation, no timestamps/paths/version in output |
| 3 | Source-compat regression in must-keep surface | High | App gate in Phase 0; SDK-level mocks are compile-time canaries; Phase 2 is pure drop-in |
| 4 | Double coercion / null-omission diverges, breaking round-trip or server validation | High | Comparator compares numbers numerically + ignores null keys; parity allowlist; dedicated `isDouble`/nullable-omit fixtures |
| 5 | `AssetEditActionItemDto.parameters` emitted as typed union not raw map | High | `overrides.ts` entry keyed `(AssetEditActionItemDto, parameters)`; round-trip + parity assert raw-map passthrough |
| 6 | Abortable branch collides with generator landing | Medium | Generator emits abortable signatures from day one; rebase `origin/chore/mobile-abortable-openapi` onto it; pin forked `http`/`cupertino_http`/`ok_http` in emitted pubspec |
| 7 | Circular `openapi → immich_mobile` breaks analyzer-gate `pub get` ordering | Medium | Run isolated `dart analyze mobile/openapi` only after mobile deps resolve; emit `immich_mobile: path: ../` exactly |
| 8 | Parity fixture gaps miss real-world shapes | Medium | Capture real server responses via e2e in Phase 1 shadow window; full release cycle before cutover; spec-`example` overlay |
| 9 | `valueUnknown` breaks exhaustive switches (old threw) | Medium | Defer to Phase 4 after parity retired; breaks surface as analyzer errors (desirable); fix switches same PR |
| 10 | `origin/refactor/drop-dart-patches` (v7.22.0) conflicts | Low | This rewrite supersedes it; close/rebase; don't run both |
| 11 | Lost oracle — drift check proves only stability, not correctness, once output intentionally differs | Medium | Round-trip + parity establish correctness before Phase 2; don't delete parity until a full stable release on new output |

## 10. Implementation plan (dependency-aware work modules)

Disjoint file ownership; ordered into tiers. **Tier 0 = shared contracts (must be built first, gate everything).** Tier 1 depends only on Tier 0. Tier 2 emitters parallelize freely. Runtime files and most tests parallelize from the start.

### Tier 0 — Shared contracts (BUILD FIRST, serialize these)

- **M0 — IR types.** Owns `src/ir/types.ts`, `src/pipeline.ts` (signatures only), `GeneratorOptions`. Inputs: §4 of this doc. Outputs: the closed IR union every other module imports. Depends on: nothing. **Blocks everything.**
- **M1 — CodeWriter + Dart naming.** Owns `src/emit/code-writer.ts`, `src/emit/dart-naming.ts` (snake/Pascal/camel + enum-value sanitizer). Inputs: §5 banner, §5.2 sanitization rules. Outputs: `CodeWriter` class, pure casing fns. Depends on: nothing. **Blocks all emitters.**
- **M2 — Name registry + determinism utils.** Owns `src/ir/name-registry.ts`, `src/util/topo-sort.ts`, `src/util/deterministic.ts`. Outputs: `NameRegistry.allocate/reserve`, topo sort, sorted-entries. Depends on: M0 (reads IR shape), M1 (casing). **Blocks resolve-names.**

### Tier 1 — Loader + normalizer (depend on Tier 0)

- **M3 — Spec loader + ref index.** Owns `src/loader/load-spec.ts`, `src/loader/index-refs.ts`. Inputs: spec path. Outputs: parsed Document + `Map<specName, rawNode>`; asserts 3.0.x. Depends on: M0.
- **M4 — Schema walker.** Owns `src/ir/schema-walker.ts`. Inputs: raw schema node + refIndex. Outputs: `TypeModel`/`Declaration`. Implements §5.4 allOf flatten/collapse, anyOf→Union, tri-state derivation, scalar mapping table, alias/freeform/binary classification. Depends on: M0, M3.
- **M5 — Operation walker.** Owns `src/ir/operation-walker.ts`. Outputs: `OperationModel`/`ApiModel` incl. inline-array response synthesis, multipart part plan, header/query/path params, style/explode defaults, security. Depends on: M0, M3, M4.
- **M6 — Overrides table.** Owns `src/ir/overrides.ts`. Outputs: `(specName, propName) → forcedRaw` (the `AssetEditActionItemDto.parameters` entry). Depends on: M0. (Small; can pair with M4.)
- **M7 — Builder + resolve-names.** Owns `src/ir/builder.ts`, `src/ir/resolve-names.ts`. Inputs: M3 doc, M4/M5/M6 walkers. Outputs: fully-named, stably-ordered `IrDocument`. Depends on: M0, M2, M3, M4, M5, M6.

### Tier 2 — Emitters (PARALLELIZE; all depend only on M0+M1, consume final IR)

- **M8 — emit-enum.** Owns `src/emit/emit-enum.ts`. Implements §5.2 (preserve member casing, `valueUnknown`, tolerant `static Enum? fromJson`). Depends on: M0, M1.
- **M9 — emit-model.** Owns `src/emit/emit-model.ts`. Implements §5.1 (tri-state matrix, `upgradeDto` first line, double coercion, `List<T?>`/`Set`, null-omit toJson, no-assert, copyWith sentinel, `static T? fromJson(dynamic)`, free-form maps, `forcedRaw` passthrough). Depends on: M0, M1.
- **M10 — emit-union.** Owns `src/emit/emit-union.ts`. Implements §5.3 (sealed base + leaves, discriminated/try-each dispatch). Depends on: M0, M1.
- **M11 — emit-alias.** Owns `src/emit/emit-alias.ts` (`typedef`). Depends on: M0, M1.
- **M12 — emit-api.** Owns `src/emit/emit-api.ts`. Implements §5.5 (dual forms, `Future<T?>`, abortTrigger threading + param reshape, multipart, query collectionFormat, binary/204/deprecated handling). Depends on: M0, M1.
- **M13 — emit-library + api-defaults.** Owns `src/emit/emit-library.ts`, `src/emit/emit-api-defaults.ts`. Emits `api.dart` (library, sorted part directives, shared imports incl. `flutter/foundation.dart` + `openapi_patching.dart`, `defaultApiClient`) and the Phase-4 `ApiDefaults` skeleton (spec-derived defaults table; emitted but call-site stays `upgradeDto` until Phase 4). Depends on: M0, M1, M7 (needs final declaration list for part directives).

### Tier 2b — Runtime files (PARALLELIZE; no codegen — hand-written Dart, copied verbatim)

- **M14 — runtime/api_client.dart + auth.** Owns `src/emit/runtime/api_client.dart`, `src/emit/runtime/auth/*.dart`. Implements §5.6 (mutable basePath/client, async deserialize via compute, `invokeAPI` + Abortable* + abortTrigger, static fromJson switch, ctor). Depends on: design only (M0 for the fromJson-switch type list at copy time — coordinate the registered-type list with M9/M8, but the file itself is static). Can start immediately.
- **M15 — runtime/api_exception.dart + api_helper.dart + serialization.dart.** Owns those files. `ApiException(int,[String?])`, `QueryParam`/`_queryParams`/`parameterToString`/`_decodeBodyBytes`/`_dateTimeFromJson`/`_toDouble`/`_listOf`/`_deepEquality`/`mapValueOfType`. Depends on: design only. Can start immediately.
- **M16 — runtime/pubspec.fragment.yaml + bin shim + mise wiring.** Owns `open-api/bin/generate-dart-sdk.sh` (rewrite), `open-api/mise.toml` task repoint, `src/index.ts` CLI, `package.json`/`tsconfig.json`, emitted pubspec fragment. Depends on: M0 (CLI calls `run`), but file-wise disjoint; can start immediately, integrate after M7+emitters.

### Tier 3 — Validation (PARALLELIZE against emitters; some need final output)

- **M17 — Generator unit tests + edge fixtures.** Owns `dart-generator/test/**`, `dart-generator/test/fixtures/**`. Mini-specs per Finding-1 edge case; asserts every `fromJson` has the `upgradeDto` line, raw-map override, alias typedef, etc. Depends on: each emitter it tests (M8–M13) — can be written in lockstep with each.
- **M18 — Dart round-trip test emitter.** Owns the `emit/` code that generates `mobile/openapi/test/roundtrip_test.dart` (synthetic max-fill builders + comparator). Depends on: M0, M1, M9 (mirrors model emission). 
- **M19 — Parity harness + CI jobs.** Owns `mobile/test/openapi_parity/**`, the `open-api-dart-parity` mise task, `mobile-openapi-validate`/`mobile-openapi-parity` CI job YAML, the determinism self-check step. Depends on: M16 (build wiring), full generator output. Transition-only; deleted in Phase 3.

**Critical path:** M0 → M1/M2 → M3 → M4 → M7 → emitters (M8–M13) → M16 integration → M18/M19. Runtime files (M14–M16) and unit-test scaffolding (M17) start immediately in parallel with Tier 0/1. The maximally-parallel fan-out point is after M7 lands the final `IrDocument`: all six emitters (M8–M13) proceed independently against the frozen IR.

---

**Key files:** spec `/Users/_gm1n/Immich/open-api/immich-openapi-specs.json`; generator root `/Users/_gm1n/Immich/open-api/dart-generator/`; output `/Users/_gm1n/Immich/mobile/openapi/`; build script `/Users/_gm1n/Immich/open-api/bin/generate-dart-sdk.sh`; mise task `/Users/_gm1n/Immich/open-api/mise.toml`; compat shim kept `/Users/_gm1n/Immich/mobile/lib/utils/openapi_patching.dart`; app anchor `/Users/_gm1n/Immich/mobile/lib/services/api.service.dart`; drift CI `/Users/_gm1n/Immich/.github/workflows/test.yml`; retiring `/Users/_gm1n/Immich/open-api/templates/mobile/**` + `/Users/_gm1n/Immich/open-api/patch/**`.