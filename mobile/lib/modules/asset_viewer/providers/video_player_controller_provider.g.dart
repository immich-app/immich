// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'video_player_controller_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$videoPlayerControllerHash() =>
    r'40b31f7b1a73fab84c311b0f06bedf5322143cd9';

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

/// See also [videoPlayerController].
@ProviderFor(videoPlayerController)
const videoPlayerControllerProvider = VideoPlayerControllerFamily();

/// See also [videoPlayerController].
class VideoPlayerControllerFamily
    extends Family<AsyncValue<VideoPlayerController>> {
  /// See also [videoPlayerController].
  const VideoPlayerControllerFamily();

  /// See also [videoPlayerController].
  VideoPlayerControllerProvider call({
    required Asset asset,
  }) {
    return VideoPlayerControllerProvider(
      asset: asset,
    );
  }

  @override
  VideoPlayerControllerProvider getProviderOverride(
    covariant VideoPlayerControllerProvider provider,
  ) {
    return call(
      asset: provider.asset,
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
  String? get name => r'videoPlayerControllerProvider';
}

/// See also [videoPlayerController].
class VideoPlayerControllerProvider
    extends AutoDisposeFutureProvider<VideoPlayerController> {
  /// See also [videoPlayerController].
  VideoPlayerControllerProvider({
    required Asset asset,
  }) : this._internal(
          (ref) => videoPlayerController(
            ref as VideoPlayerControllerRef,
            asset: asset,
          ),
          from: videoPlayerControllerProvider,
          name: r'videoPlayerControllerProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$videoPlayerControllerHash,
          dependencies: VideoPlayerControllerFamily._dependencies,
          allTransitiveDependencies:
              VideoPlayerControllerFamily._allTransitiveDependencies,
          asset: asset,
        );

  VideoPlayerControllerProvider._internal(
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
    FutureOr<VideoPlayerController> Function(VideoPlayerControllerRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: VideoPlayerControllerProvider._internal(
        (ref) => create(ref as VideoPlayerControllerRef),
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
  AutoDisposeFutureProviderElement<VideoPlayerController> createElement() {
    return _VideoPlayerControllerProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is VideoPlayerControllerProvider && other.asset == asset;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, asset.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin VideoPlayerControllerRef
    on AutoDisposeFutureProviderRef<VideoPlayerController> {
  /// The parameter `asset` of this provider.
  Asset get asset;
}

class _VideoPlayerControllerProviderElement
    extends AutoDisposeFutureProviderElement<VideoPlayerController>
    with VideoPlayerControllerRef {
  _VideoPlayerControllerProviderElement(super.provider);

  @override
  Asset get asset => (origin as VideoPlayerControllerProvider).asset;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
