// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'activity_statistics.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$activityStatisticsHash() =>
    r'a5f7bbee1891c33b72919a34e632ca9ef9cd8dbf';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$ActivityStatistics extends BuildlessAutoDisposeNotifier<int> {
  late final String albumId;
  late final String? assetId;

  int build(
    String albumId, [
    String? assetId,
  ]);
}

/// Maintains the current number of comments by <shared-album, asset>
///
/// Copied from [ActivityStatistics].
@ProviderFor(ActivityStatistics)
const activityStatisticsProvider = ActivityStatisticsFamily();

/// Maintains the current number of comments by <shared-album, asset>
///
/// Copied from [ActivityStatistics].
class ActivityStatisticsFamily extends Family<int> {
  /// Maintains the current number of comments by <shared-album, asset>
  ///
  /// Copied from [ActivityStatistics].
  const ActivityStatisticsFamily();

  /// Maintains the current number of comments by <shared-album, asset>
  ///
  /// Copied from [ActivityStatistics].
  ActivityStatisticsProvider call(
    String albumId, [
    String? assetId,
  ]) {
    return ActivityStatisticsProvider(
      albumId,
      assetId,
    );
  }

  @override
  ActivityStatisticsProvider getProviderOverride(
    covariant ActivityStatisticsProvider provider,
  ) {
    return call(
      provider.albumId,
      provider.assetId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'activityStatisticsProvider';
}

/// Maintains the current number of comments by <shared-album, asset>
///
/// Copied from [ActivityStatistics].
class ActivityStatisticsProvider
    extends AutoDisposeNotifierProviderImpl<ActivityStatistics, int> {
  /// Maintains the current number of comments by <shared-album, asset>
  ///
  /// Copied from [ActivityStatistics].
  ActivityStatisticsProvider(
    String albumId, [
    String? assetId,
  ]) : this._internal(
          () => ActivityStatistics()
            ..albumId = albumId
            ..assetId = assetId,
          from: activityStatisticsProvider,
          name: r'activityStatisticsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$activityStatisticsHash,
          dependencies: ActivityStatisticsFamily._dependencies,
          allTransitiveDependencies:
              ActivityStatisticsFamily._allTransitiveDependencies,
          albumId: albumId,
          assetId: assetId,
        );

  ActivityStatisticsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.albumId,
    required this.assetId,
  }) : super.internal();

  final String albumId;
  final String? assetId;

  @override
  int runNotifierBuild(
    covariant ActivityStatistics notifier,
  ) {
    return notifier.build(
      albumId,
      assetId,
    );
  }

  @override
  Override overrideWith(ActivityStatistics Function() create) {
    return ProviderOverride(
      origin: this,
      override: ActivityStatisticsProvider._internal(
        () => create()
          ..albumId = albumId
          ..assetId = assetId,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        albumId: albumId,
        assetId: assetId,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<ActivityStatistics, int> createElement() {
    return _ActivityStatisticsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ActivityStatisticsProvider &&
        other.albumId == albumId &&
        other.assetId == assetId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, albumId.hashCode);
    hash = _SystemHash.combine(hash, assetId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin ActivityStatisticsRef on AutoDisposeNotifierProviderRef<int> {
  /// The parameter `albumId` of this provider.
  String get albumId;

  /// The parameter `assetId` of this provider.
  String? get assetId;
}

class _ActivityStatisticsProviderElement
    extends AutoDisposeNotifierProviderElement<ActivityStatistics, int>
    with ActivityStatisticsRef {
  _ActivityStatisticsProviderElement(super.provider);

  @override
  String get albumId => (origin as ActivityStatisticsProvider).albumId;
  @override
  String? get assetId => (origin as ActivityStatisticsProvider).assetId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
