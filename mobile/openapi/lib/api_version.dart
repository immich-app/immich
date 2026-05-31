// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// Self-contained version type for server-capability gating. Intentionally has
// no dependency on the host app: the generated client is a lower layer and
// must not reach up into application utilities.
part of openapi.api;

/// An Immich server API version, used to gate endpoints and DTO fields that
/// were added or deprecated at a particular release.
///
/// Version metadata is derived at generation time from the spec's
/// `x-immich-history` and emitted as `const ApiVersion(...)` literals on the
/// `*Meta` types, so comparisons are const-friendly and cheap:
///
/// ```dart
/// if (ApiVersion.parse(server.version) >= AssetResponseDtoMeta.isEditedAddedIn) {
///   // safe to read `isEdited`
/// }
/// ```
final class ApiVersion implements Comparable<ApiVersion> {
  const ApiVersion(this.major, this.minor, this.patch);

  final int major;
  final int minor;
  final int patch;

  /// Parses `"v2.6.0"`, `"2.6.0"`, or a bare `"v1"`/`"2"` (missing components
  /// default to zero). Returns `null` when the string is not a version.
  static ApiVersion? tryParse(String value) {
    final core = value.trim().replaceFirst(RegExp(r'^v', caseSensitive: false), '').split(RegExp(r'[-+]')).first;
    if (core.isEmpty) return null;
    final parts = core.split('.');
    final nums = <int>[];
    for (final part in parts) {
      final n = int.tryParse(part);
      if (n == null) return null;
      nums.add(n);
    }
    return ApiVersion(
      nums.isNotEmpty ? nums[0] : 0,
      nums.length > 1 ? nums[1] : 0,
      nums.length > 2 ? nums[2] : 0,
    );
  }

  /// Like [tryParse] but throws [FormatException] on a malformed string.
  factory ApiVersion.parse(String value) =>
      tryParse(value) ?? (throw FormatException('Invalid API version', value));

  @override
  int compareTo(ApiVersion other) {
    final byMajor = major.compareTo(other.major);
    if (byMajor != 0) return byMajor;
    final byMinor = minor.compareTo(other.minor);
    if (byMinor != 0) return byMinor;
    return patch.compareTo(other.patch);
  }

  bool operator >(ApiVersion other) => compareTo(other) > 0;
  bool operator >=(ApiVersion other) => compareTo(other) >= 0;
  bool operator <(ApiVersion other) => compareTo(other) < 0;
  bool operator <=(ApiVersion other) => compareTo(other) <= 0;

  /// Whether this version (typically the connected server's) is new enough to
  /// support a [feature] introduced at the given version. Reads naturally:
  ///
  /// ```dart
  /// if (serverVersion.supports(AssetResponseDto.isEditedAddedIn)) { ... }
  /// ```
  bool supports(ApiVersion feature) => this >= feature;

  @override
  bool operator ==(Object other) =>
      other is ApiVersion && other.major == major && other.minor == minor && other.patch == patch;

  @override
  int get hashCode => Object.hash(major, minor, patch);

  @override
  String toString() => '$major.$minor.$patch';
}
