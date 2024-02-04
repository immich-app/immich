// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sorted_album.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$sortedAlbumHash() => r'350f537324a42ba9e01e50ca3722878ec3a8330c';

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

/// See also [sortedAlbum].
@ProviderFor(sortedAlbum)
const sortedAlbumProvider = SortedAlbumFamily();

/// See also [sortedAlbum].
class SortedAlbumFamily extends Family<List<Album>> {
  /// See also [sortedAlbum].
  const SortedAlbumFamily();

  /// See also [sortedAlbum].
  SortedAlbumProvider call(
    List<Album> albums,
  ) {
    return SortedAlbumProvider(
      albums,
    );
  }

  @override
  SortedAlbumProvider getProviderOverride(
    covariant SortedAlbumProvider provider,
  ) {
    return call(
      provider.albums,
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
  String? get name => r'sortedAlbumProvider';
}

/// See also [sortedAlbum].
class SortedAlbumProvider extends AutoDisposeProvider<List<Album>> {
  /// See also [sortedAlbum].
  SortedAlbumProvider(
    List<Album> albums,
  ) : this._internal(
          (ref) => sortedAlbum(
            ref as SortedAlbumRef,
            albums,
          ),
          from: sortedAlbumProvider,
          name: r'sortedAlbumProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$sortedAlbumHash,
          dependencies: SortedAlbumFamily._dependencies,
          allTransitiveDependencies:
              SortedAlbumFamily._allTransitiveDependencies,
          albums: albums,
        );

  SortedAlbumProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.albums,
  }) : super.internal();

  final List<Album> albums;

  @override
  Override overrideWith(
    List<Album> Function(SortedAlbumRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: SortedAlbumProvider._internal(
        (ref) => create(ref as SortedAlbumRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        albums: albums,
      ),
    );
  }

  @override
  AutoDisposeProviderElement<List<Album>> createElement() {
    return _SortedAlbumProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is SortedAlbumProvider && other.albums == albums;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, albums.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin SortedAlbumRef on AutoDisposeProviderRef<List<Album>> {
  /// The parameter `albums` of this provider.
  List<Album> get albums;
}

class _SortedAlbumProviderElement
    extends AutoDisposeProviderElement<List<Album>> with SortedAlbumRef {
  _SortedAlbumProviderElement(super.provider);

  @override
  List<Album> get albums => (origin as SortedAlbumProvider).albums;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
