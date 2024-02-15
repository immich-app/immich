// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$assetsHash() => r'89d151eead499747703a2361efd178ba89e87be8';

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

/// See also [assets].
@ProviderFor(assets)
const assetsProvider = AssetsFamily();

/// See also [assets].
class AssetsFamily extends Family<AsyncValue<RenderList>> {
  /// See also [assets].
  const AssetsFamily();

  /// See also [assets].
  AssetsProvider call(
    int? userId,
  ) {
    return AssetsProvider(
      userId,
    );
  }

  @override
  AssetsProvider getProviderOverride(
    covariant AssetsProvider provider,
  ) {
    return call(
      provider.userId,
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
  String? get name => r'assetsProvider';
}

/// See also [assets].
class AssetsProvider extends AutoDisposeStreamProvider<RenderList> {
  /// See also [assets].
  AssetsProvider(
    int? userId,
  ) : this._internal(
          (ref) => assets(
            ref as AssetsRef,
            userId,
          ),
          from: assetsProvider,
          name: r'assetsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$assetsHash,
          dependencies: AssetsFamily._dependencies,
          allTransitiveDependencies: AssetsFamily._allTransitiveDependencies,
          userId: userId,
        );

  AssetsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.userId,
  }) : super.internal();

  final int? userId;

  @override
  Override overrideWith(
    Stream<RenderList> Function(AssetsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AssetsProvider._internal(
        (ref) => create(ref as AssetsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        userId: userId,
      ),
    );
  }

  @override
  AutoDisposeStreamProviderElement<RenderList> createElement() {
    return _AssetsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AssetsProvider && other.userId == userId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, userId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin AssetsRef on AutoDisposeStreamProviderRef<RenderList> {
  /// The parameter `userId` of this provider.
  int? get userId;
}

class _AssetsProviderElement
    extends AutoDisposeStreamProviderElement<RenderList> with AssetsRef {
  _AssetsProviderElement(super.provider);

  @override
  int? get userId => (origin as AssetsProvider).userId;
}

String _$multiUserAssetsHash() => r'63a9506e21d34e66af2af93946930016d51b0b43';

/// See also [multiUserAssets].
@ProviderFor(multiUserAssets)
const multiUserAssetsProvider = MultiUserAssetsFamily();

/// See also [multiUserAssets].
class MultiUserAssetsFamily extends Family<AsyncValue<RenderList>> {
  /// See also [multiUserAssets].
  const MultiUserAssetsFamily();

  /// See also [multiUserAssets].
  MultiUserAssetsProvider call(
    List<int> userIds,
  ) {
    return MultiUserAssetsProvider(
      userIds,
    );
  }

  @override
  MultiUserAssetsProvider getProviderOverride(
    covariant MultiUserAssetsProvider provider,
  ) {
    return call(
      provider.userIds,
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
  String? get name => r'multiUserAssetsProvider';
}

/// See also [multiUserAssets].
class MultiUserAssetsProvider extends AutoDisposeStreamProvider<RenderList> {
  /// See also [multiUserAssets].
  MultiUserAssetsProvider(
    List<int> userIds,
  ) : this._internal(
          (ref) => multiUserAssets(
            ref as MultiUserAssetsRef,
            userIds,
          ),
          from: multiUserAssetsProvider,
          name: r'multiUserAssetsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$multiUserAssetsHash,
          dependencies: MultiUserAssetsFamily._dependencies,
          allTransitiveDependencies:
              MultiUserAssetsFamily._allTransitiveDependencies,
          userIds: userIds,
        );

  MultiUserAssetsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.userIds,
  }) : super.internal();

  final List<int> userIds;

  @override
  Override overrideWith(
    Stream<RenderList> Function(MultiUserAssetsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MultiUserAssetsProvider._internal(
        (ref) => create(ref as MultiUserAssetsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        userIds: userIds,
      ),
    );
  }

  @override
  AutoDisposeStreamProviderElement<RenderList> createElement() {
    return _MultiUserAssetsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MultiUserAssetsProvider && other.userIds == userIds;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, userIds.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MultiUserAssetsRef on AutoDisposeStreamProviderRef<RenderList> {
  /// The parameter `userIds` of this provider.
  List<int> get userIds;
}

class _MultiUserAssetsProviderElement
    extends AutoDisposeStreamProviderElement<RenderList>
    with MultiUserAssetsRef {
  _MultiUserAssetsProviderElement(super.provider);

  @override
  List<int> get userIds => (origin as MultiUserAssetsProvider).userIds;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
