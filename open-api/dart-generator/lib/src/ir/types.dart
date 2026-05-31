/// The Intermediate Representation (IR) for the Immich Dart client generator.
///
/// Pipeline:
///
///   spec.json --load--> raw maps --normalize--> IrDocument
///              --resolveNames--> IrDocument --emit--> Dart
///
/// After normalization, NOTHING reads the raw OpenAPI document again — every
/// OpenAPI edge case is resolved here, once, into these types. The type model
/// is a `sealed` hierarchy so every emitter `switch` over it is exhaustiveness-
/// checked by the analyzer: the generator's own compile-time mirror of the
/// Dart `sealed` exhaustiveness it emits.
///
/// `final`/`late`-free mutable fields named `dartName`/`fileName` are slots
/// filled by the name-resolution pass; everything else is fixed at
/// normalization time.
library;

// ─────────────────────────────────────────────────────────────────────────
// Version metadata (from x-immich-history / x-immich-state / x-immich-permission)
//
// Parsed at GENERATION time so bare "v1"/"v2" normalize to 1.0.0/2.0.0 and we
// dodge the app SemVer.fromString's 3-part requirement. Emitted as
// `const SemVer(...)` literals; an absent `deprecatedIn` becomes `Option.none()`.
// ─────────────────────────────────────────────────────────────────────────

/// A semantic version parsed from a spec version string at generation time.
class SemVerLit {
  final int major;
  final int minor;
  final int patch;

  const SemVerLit(this.major, this.minor, this.patch);

  @override
  bool operator ==(Object other) =>
      other is SemVerLit &&
      other.major == major &&
      other.minor == minor &&
      other.patch == patch;

  @override
  int get hashCode => Object.hash(major, minor, patch);

  @override
  String toString() => '$major.$minor.$patch';
}

/// Lifecycle states seen in x-immich-state / x-immich-history `state`.
enum LifecycleState { added, alpha, beta, stable, updated, deprecated, internal }

/// One entry of an x-immich-history array.
class VersionEvent {
  final SemVerLit version;

  /// The raw spec string ("v1", "v2.6.0") kept for docs/debugging.
  final String rawVersion;
  final LifecycleState state;
  final String? description;

  const VersionEvent({
    required this.version,
    required this.rawVersion,
    required this.state,
    this.description,
  });
}

/// Derived server-version facts for an endpoint or a field. Absent on
/// artifacts the spec does not annotate.
class VersionMeta {
  /// First `added` event's version.
  final SemVerLit? addedIn;

  /// Version at which a `deprecated` event occurred, if any.
  final SemVerLit? deprecatedIn;

  /// Current lifecycle state (x-immich-state, else the last history state).
  final LifecycleState? state;

  /// Full ordered history, for richer accessors / docs.
  final List<VersionEvent> history;

  const VersionMeta({
    this.addedIn,
    this.deprecatedIn,
    this.state,
    this.history = const [],
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Shared metadata for every top-level named declaration
// ─────────────────────────────────────────────────────────────────────────

class NamedMeta {
  /// The schema's name in components.schemas.
  final String specName;

  /// PascalCase Dart class/enum name — filled by resolveNames.
  String dartName;

  /// snake_case file stem (no extension) — filled by resolveNames.
  String fileName;
  final String? description;
  final bool deprecated;
  final VersionMeta? versionMeta;

  NamedMeta({
    required this.specName,
    this.dartName = '',
    this.fileName = '',
    this.description,
    this.deprecated = false,
    this.versionMeta,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Type model
// ─────────────────────────────────────────────────────────────────────────

/// The root of the type hierarchy. Sealed ⇒ exhaustive emitter switches.
sealed class TypeModel {}

/// A type that is also a top-level declaration (its own Dart file).
sealed class NamedType extends TypeModel {
  NamedMeta get meta;
}

/// How a [PrimitiveType] maps to a Dart core type (decided in the emitter).
enum PrimitiveKind {
  string,
  integer, // → int
  float, // → double
  number, // → num
  boolean, // → bool
  dateTime, // → DateTime
  date, // → DateTime (date-only)
  object, // → Object
}

final class PrimitiveType extends TypeModel {
  final PrimitiveKind primitive;

  /// Retained for docs / future 32-vs-64-bit choices; never changes the type.
  final ScalarConstraints? constraints;

  /// Bare `number` with no format — defaulted to `double` by the emitter.
  final bool numberAmbiguous;

  PrimitiveType(this.primitive, {this.constraints, this.numberAmbiguous = false});
}

class ScalarConstraints {
  final String? pattern;
  final num? minimum;
  final num? maximum;
  final int? minLength;
  final int? maxLength;
  final String? format;

  const ScalarConstraints({
    this.pattern,
    this.minimum,
    this.maximum,
    this.minLength,
    this.maxLength,
    this.format,
  });
}

final class EnumType extends NamedType {
  @override
  final NamedMeta meta;
  final EnumBacking backing;
  final List<EnumMember> members;

  EnumType({required this.meta, required this.backing, required this.members});
}

enum EnumBacking { string, integer }

class EnumMember {
  /// Exact wire value, preserved for (de)serialization.
  final Object wireValue; // String or int
  /// Sanitized Dart identifier — filled by resolveNames.
  String dartName;
  final String? description;
  final bool deprecated;

  EnumMember({
    required this.wireValue,
    this.dartName = '',
    this.description,
    this.deprecated = false,
  });
}

final class ObjectType extends NamedType {
  @override
  final NamedMeta meta;

  /// allOf already merged; spec property order preserved.
  final List<Property> properties;

  /// Present when the schema allows additionalProperties (typed or free-form).
  final AdditionalProps? additional;

  /// True when this DTO is used as a multipart/form-data request body.
  final bool isMultipart;

  /// True when this DTO is used as a JSON request body (POST/PUT/PATCH), so its
  /// optional fields are emitted as three-state `Option<T?>` (absent / null /
  /// present) for correct merge-patch semantics. Set by [buildIr] after the
  /// operations are walked.
  bool threeState = false;

  ObjectType({
    required this.meta,
    required this.properties,
    this.additional,
    this.isMultipart = false,
  });
}

class Property {
  final String wireName;
  String dartName;
  final TypeModel type;

  /// These three are INDEPENDENT. Never collapse `nullable ⇒ optional`:
  /// 105 fields are required-AND-nullable (present on the wire, may be null).
  final bool required;
  final bool nullable;
  final DefaultValue? defaultValue;
  final String? description;
  final bool deprecated;
  final VersionMeta? versionMeta;

  /// Set by the overrides table. [ForcedRaw.freeform] forces a raw
  /// `Map<String, dynamic>` with passthrough ser/deser
  /// (the AssetEditActionItemDto.parameters case).
  final ForcedRaw? forcedRaw;

  Property({
    required this.wireName,
    this.dartName = '',
    required this.type,
    required this.required,
    required this.nullable,
    this.defaultValue,
    this.description,
    this.deprecated = false,
    this.versionMeta,
    this.forcedRaw,
  });
}

enum ForcedRaw { freeform }

sealed class DefaultValue {
  const DefaultValue();
}

final class NullDefault extends DefaultValue {
  const NullDefault();
}

final class BoolDefault extends DefaultValue {
  final bool value;
  const BoolDefault(this.value);
}

final class NumberDefault extends DefaultValue {
  final num value;
  const NumberDefault(this.value);
}

final class StringDefault extends DefaultValue {
  final String value;
  const StringDefault(this.value);
}

final class EnumDefault extends DefaultValue {
  final RefType enumRef;
  final Object enumMemberWire; // String or int
  const EnumDefault(this.enumRef, this.enumMemberWire);
}

class AdditionalProps {
  /// null ⇒ free-form `Map<String, dynamic>`; otherwise a typed value map.
  final TypeModel? valueType;
  final bool nullable;

  const AdditionalProps({this.valueType, this.nullable = false});
}

final class ArrayType extends TypeModel {
  final TypeModel items;

  /// List<T?> — independent of whether the array itself is nullable.
  final bool itemsNullable;

  /// uniqueItems ⇒ emit Set<T> instead of List<T>.
  final bool unique;
  final int? minItems;
  final int? maxItems;

  ArrayType(
    this.items, {
    this.itemsNullable = false,
    this.unique = false,
    this.minItems,
    this.maxItems,
  });
}

final class MapType extends TypeModel {
  /// null ⇒ Map<String, dynamic>.
  final TypeModel? valueType;
  final bool valueNullable;

  MapType({this.valueType, this.valueNullable = false});
}

final class RefType extends TypeModel {
  final String specName;

  /// Resolved target Dart name — filled by resolveNames.
  String? dartName;

  RefType(this.specName, {this.dartName});
}

final class AliasType extends NamedType {
  @override
  final NamedMeta meta;

  /// `typedef <dartName> = <target>;`
  final RefType target;

  AliasType({required this.meta, required this.target});
}

final class UnionType extends NamedType {
  @override
  final NamedMeta meta;
  final UnionComposition composition;
  final List<RefType> variants;

  /// Present ⇒ tagged dispatch; null ⇒ structural try-each in spec order.
  final Discriminator? discriminator;

  UnionType({
    required this.meta,
    required this.composition,
    required this.variants,
    this.discriminator,
  });
}

enum UnionComposition { oneOf, anyOf }

class Discriminator {
  final String propertyName;

  /// discriminator value → variant.
  final Map<String, RefType> mapping;

  const Discriminator({required this.propertyName, required this.mapping});
}

final class BinaryType extends TypeModel {
  final BinaryRole role;
  BinaryType(this.role);
}

enum BinaryRole { upload, download }

/// `additionalProperties: {}` at the value position — any JSON value.
final class FreeFormType extends TypeModel {}

/// A schema the normalizer could not classify; emitters fall back to `Object?`.
final class UnknownType extends TypeModel {
  final String reason;
  UnknownType(this.reason);
}

// ─────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────

class ApiModel {
  /// PascalCase, e.g. `AssetsApi` — filled by resolveNames.
  String dartName;
  String fileName;
  final String tag;
  final List<OperationModel> operations;

  ApiModel({this.dartName = '', this.fileName = '', required this.tag, required this.operations});
}

enum HttpMethod { get, post, put, patch, delete }

class OperationModel {
  /// camelCase method name — filled by resolveNames.
  String dartName;
  final String operationId;
  final HttpMethod httpMethod;
  final String path;
  final bool deprecated;
  final String? description;
  final String? summary;
  final List<Param> pathParams;
  final List<Param> queryParams;
  final List<Param> headerParams;
  final RequestBody? body;
  final List<ResponseModel> responses;
  final ResponseModel successResponse;
  final List<SecurityRequirement> security;
  final VersionMeta? versionMeta;

  OperationModel({
    this.dartName = '',
    required this.operationId,
    required this.httpMethod,
    required this.path,
    this.deprecated = false,
    this.description,
    this.summary,
    this.pathParams = const [],
    this.queryParams = const [],
    this.headerParams = const [],
    this.body,
    required this.responses,
    required this.successResponse,
    this.security = const [],
    this.versionMeta,
  });
}

class Param {
  final String wireName;
  String dartName;
  final TypeModel type;
  final bool required;
  final bool nullable;
  final DefaultValue? defaultValue;
  final String? description;

  /// Query serialization style; default form.
  final ParamStyle style;

  /// Default true ⇒ repeated key (?k=a&k=b).
  final bool explode;

  Param({
    required this.wireName,
    this.dartName = '',
    required this.type,
    required this.required,
    required this.nullable,
    this.defaultValue,
    this.description,
    this.style = ParamStyle.form,
    this.explode = true,
  });
}

enum ParamStyle { form, spaceDelimited, pipeDelimited }

class RequestBody {
  final bool required;
  final BodyContent content;
  const RequestBody({required this.required, required this.content});
}

sealed class BodyContent {
  const BodyContent();
}

final class JsonBody extends BodyContent {
  final TypeModel type;
  const JsonBody(this.type);
}

final class MultipartBody extends BodyContent {
  final RefType type;
  final List<MultipartPart> parts;
  const MultipartBody(this.type, this.parts);
}

final class UrlEncodedBody extends BodyContent {
  final TypeModel type;
  const UrlEncodedBody(this.type);
}

class MultipartPart {
  final String wireName;
  final TypeModel type;
  final bool required;

  /// True for `format: binary` parts → MultipartFile.
  final bool isFile;

  const MultipartPart({
    required this.wireName,
    required this.type,
    required this.required,
    this.isFile = false,
  });
}

class ResponseModel {
  final int statusCode;

  /// null ⇒ void; [BinaryType] download ⇒ raw bytes;
  /// [ArrayType] ⇒ inline list synthesized at the operation site.
  final TypeModel? type;
  final ResponseContentType? contentType;

  const ResponseModel({required this.statusCode, this.type, this.contentType});
}

enum ResponseContentType { json, octetStream }

sealed class SecurityScheme {
  final String name;
  const SecurityScheme(this.name);
}

final class HttpBearerScheme extends SecurityScheme {
  const HttpBearerScheme(super.name);
}

final class ApiKeyHeaderScheme extends SecurityScheme {
  final String headerName;
  const ApiKeyHeaderScheme(super.name, this.headerName);
}

final class ApiKeyCookieScheme extends SecurityScheme {
  final String cookieName;
  const ApiKeyCookieScheme(super.name, this.cookieName);
}

class SecurityRequirement {
  final String schemeName;
  final List<String> scopes;
  const SecurityRequirement({required this.schemeName, this.scopes = const []});
}

// ─────────────────────────────────────────────────────────────────────────
// Document root
// ─────────────────────────────────────────────────────────────────────────

class DocInfo {
  final String title;

  /// The spec's `info.version` (e.g. "3.0.0") — the current server API version.
  final String version;
  final String openApiVersion;

  const DocInfo({required this.title, required this.version, required this.openApiVersion});
}

class IrDocument {
  /// Topologically + alphabetically ordered for deterministic output.
  final List<NamedType> declarations;

  /// One per OpenAPI tag, alphabetically sorted.
  final List<ApiModel> apis;
  final List<SecurityScheme> security;
  final DocInfo info;

  const IrDocument({
    required this.declarations,
    required this.apis,
    required this.security,
    required this.info,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Generator options (idiomatic-first: no parity-vs-old-generator machinery)
// ─────────────────────────────────────────────────────────────────────────

class GeneratorOptions {
  final String specPath;
  final String outDir;

  /// Dart package name; client is imported as `package:<packageName>/api.dart`.
  final String packageName;

  /// Emit immutable `final class` models with const ctors + copyWith.
  final bool immutableModels;

  /// Emit a `valueUnknown` member + tolerant fromJson on enums.
  final bool tolerantEnums;

  /// Tighten success-response returns to non-null `Future<T>`.
  final bool nonNullReturns;

  /// Thread an `abortTrigger` through every operation + invokeAPI.
  final bool emitAbortTrigger;

  /// Emit per-endpoint/per-field server-version metadata (SemVer/Option).
  final bool emitVersionMeta;

  /// Keep the backward-compat default-injection hook.
  final bool emitCompatHook;

  /// Also emit `test/roundtrip_test.dart` (serialization round-trip suite).
  final bool emitRoundtripTest;

  const GeneratorOptions({
    required this.specPath,
    required this.outDir,
    this.packageName = 'openapi',
    this.immutableModels = true,
    this.tolerantEnums = true,
    this.nonNullReturns = true,
    this.emitAbortTrigger = true,
    this.emitVersionMeta = true,
    this.emitCompatHook = true,
    this.emitRoundtripTest = false,
  });
}
