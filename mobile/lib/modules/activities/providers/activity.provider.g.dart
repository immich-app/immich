// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'activity.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$albumActivityHash() => r'c6ea3cf0af25215a426e7816c4723bc098d31b97';

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

abstract class _$AlbumActivity
    extends BuildlessAutoDisposeAsyncNotifier<List<Activity>> {
  late final String albumId;
  late final String? assetId;

  Future<List<Activity>> build(
    String albumId, [
    String? assetId,
  ]);
}

/// See also [AlbumActivity].
@ProviderFor(AlbumActivity)
const albumActivityProvider = AlbumActivityFamily();

/// See also [AlbumActivity].
class AlbumActivityFamily extends Family<AsyncValue<List<Activity>>> {
  /// See also [AlbumActivity].
  const AlbumActivityFamily();

  /// See also [AlbumActivity].
  AlbumActivityProvider call(
    String albumId, [
    String? assetId,
  ]) {
    return AlbumActivityProvider(
      albumId,
      assetId,
    );
  }

  @override
  AlbumActivityProvider getProviderOverride(
    covariant AlbumActivityProvider provider,
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
  String? get name => r'albumActivityProvider';
}

/// See also [AlbumActivity].
class AlbumActivityProvider extends AutoDisposeAsyncNotifierProviderImpl<
    AlbumActivity, List<Activity>> {
  /// See also [AlbumActivity].
  AlbumActivityProvider(
    String albumId, [
    String? assetId,
  ]) : this._internal(
          () => AlbumActivity()
            ..albumId = albumId
            ..assetId = assetId,
          from: albumActivityProvider,
          name: r'albumActivityProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$albumActivityHash,
          dependencies: AlbumActivityFamily._dependencies,
          allTransitiveDependencies:
              AlbumActivityFamily._allTransitiveDependencies,
          albumId: albumId,
          assetId: assetId,
        );

  AlbumActivityProvider._internal(
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
  Future<List<Activity>> runNotifierBuild(
    covariant AlbumActivity notifier,
  ) {
    return notifier.build(
      albumId,
      assetId,
    );
  }

  @override
  Override overrideWith(AlbumActivity Function() create) {
    return ProviderOverride(
      origin: this,
      override: AlbumActivityProvider._internal(
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
  AutoDisposeAsyncNotifierProviderElement<AlbumActivity, List<Activity>>
      createElement() {
    return _AlbumActivityProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AlbumActivityProvider &&
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

mixin AlbumActivityRef on AutoDisposeAsyncNotifierProviderRef<List<Activity>> {
  /// The parameter `albumId` of this provider.
  String get albumId;

  /// The parameter `assetId` of this provider.
  String? get assetId;
}

class _AlbumActivityProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<AlbumActivity,
        List<Activity>> with AlbumActivityRef {
  _AlbumActivityProviderElement(super.provider);

  @override
  String get albumId => (origin as AlbumActivityProvider).albumId;
  @override
  String? get assetId => (origin as AlbumActivityProvider).assetId;
}

String _$activityStatisticsHash() =>
    r'59713471a245bce652e7829d120b2bc55cd8c8d9';

abstract class _$ActivityStatistics
    extends BuildlessAutoDisposeAsyncNotifier<int> {
  late final String albumId;
  late final String? assetId;

  Future<int> build(
    String albumId, [
    String? assetId,
  ]);
}

/// See also [ActivityStatistics].
@ProviderFor(ActivityStatistics)
const activityStatisticsProvider = ActivityStatisticsFamily();

/// See also [ActivityStatistics].
class ActivityStatisticsFamily extends Family<AsyncValue<int>> {
  /// See also [ActivityStatistics].
  const ActivityStatisticsFamily();

  /// See also [ActivityStatistics].
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

/// See also [ActivityStatistics].
class ActivityStatisticsProvider
    extends AutoDisposeAsyncNotifierProviderImpl<ActivityStatistics, int> {
  /// See also [ActivityStatistics].
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
  Future<int> runNotifierBuild(
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
  AutoDisposeAsyncNotifierProviderElement<ActivityStatistics, int>
      createElement() {
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

mixin ActivityStatisticsRef on AutoDisposeAsyncNotifierProviderRef<int> {
  /// The parameter `albumId` of this provider.
  String get albumId;

  /// The parameter `assetId` of this provider.
  String? get assetId;
}

class _ActivityStatisticsProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<ActivityStatistics, int>
    with ActivityStatisticsRef {
  _ActivityStatisticsProviderElement(super.provider);

  @override
  String get albumId => (origin as ActivityStatisticsProvider).albumId;
  @override
  String? get assetId => (origin as ActivityStatisticsProvider).assetId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
