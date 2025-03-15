// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset_stack.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$assetStackIndexHash() => r'38b4b0116e3e4592620b118ae01cf89b77da9cfe';

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

/// See also [assetStackIndex].
@ProviderFor(assetStackIndex)
const assetStackIndexProvider = AssetStackIndexFamily();

/// See also [assetStackIndex].
class AssetStackIndexFamily extends Family<int> {
  /// See also [assetStackIndex].
  const AssetStackIndexFamily();

  /// See also [assetStackIndex].
  AssetStackIndexProvider call(
    Asset asset,
  ) {
    return AssetStackIndexProvider(
      asset,
    );
  }

  @override
  AssetStackIndexProvider getProviderOverride(
    covariant AssetStackIndexProvider provider,
  ) {
    return call(
      provider.asset,
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
  String? get name => r'assetStackIndexProvider';
}

/// See also [assetStackIndex].
class AssetStackIndexProvider extends AutoDisposeProvider<int> {
  /// See also [assetStackIndex].
  AssetStackIndexProvider(
    Asset asset,
  ) : this._internal(
          (ref) => assetStackIndex(
            ref as AssetStackIndexRef,
            asset,
          ),
          from: assetStackIndexProvider,
          name: r'assetStackIndexProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$assetStackIndexHash,
          dependencies: AssetStackIndexFamily._dependencies,
          allTransitiveDependencies:
              AssetStackIndexFamily._allTransitiveDependencies,
          asset: asset,
        );

  AssetStackIndexProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.asset,
  }) : super.internal();

  final Asset asset;

  @override
  Override overrideWith(
    int Function(AssetStackIndexRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AssetStackIndexProvider._internal(
        (ref) => create(ref as AssetStackIndexRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        asset: asset,
      ),
    );
  }

  @override
  AutoDisposeProviderElement<int> createElement() {
    return _AssetStackIndexProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AssetStackIndexProvider && other.asset == asset;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, asset.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin AssetStackIndexRef on AutoDisposeProviderRef<int> {
  /// The parameter `asset` of this provider.
  Asset get asset;
}

class _AssetStackIndexProviderElement extends AutoDisposeProviderElement<int>
    with AssetStackIndexRef {
  _AssetStackIndexProviderElement(super.provider);

  @override
  Asset get asset => (origin as AssetStackIndexProvider).asset;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
