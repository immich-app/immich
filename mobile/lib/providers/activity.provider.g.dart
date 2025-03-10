// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'activity.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$albumActivityHash() => r'3b0d7acee4d41c84b3f220784c3b904c83f836e6';

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

  FutureOr<List<Activity>> build(
    String albumId, [
    String? assetId,
  ]);
}

/// Maintains the current list of all activities for <share-album-id, asset>
///
/// Copied from [AlbumActivity].
@ProviderFor(AlbumActivity)
const albumActivityProvider = AlbumActivityFamily();

/// Maintains the current list of all activities for <share-album-id, asset>
///
/// Copied from [AlbumActivity].
class AlbumActivityFamily extends Family<AsyncValue<List<Activity>>> {
  /// Maintains the current list of all activities for <share-album-id, asset>
  ///
  /// Copied from [AlbumActivity].
  const AlbumActivityFamily();

  /// Maintains the current list of all activities for <share-album-id, asset>
  ///
  /// Copied from [AlbumActivity].
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

/// Maintains the current list of all activities for <share-album-id, asset>
///
/// Copied from [AlbumActivity].
class AlbumActivityProvider extends AutoDisposeAsyncNotifierProviderImpl<
    AlbumActivity, List<Activity>> {
  /// Maintains the current list of all activities for <share-album-id, asset>
  ///
  /// Copied from [AlbumActivity].
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
  FutureOr<List<Activity>> runNotifierBuild(
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

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
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
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
