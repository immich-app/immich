// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'paginated_search.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$paginatedSearchRenderListHash() =>
    r'286f0b349f3557b41687007eca13e3cdc298568f';

/// See also [paginatedSearchRenderList].
@ProviderFor(paginatedSearchRenderList)
final paginatedSearchRenderListProvider =
    AutoDisposeProvider<AsyncValue<RenderList>>.internal(
  paginatedSearchRenderList,
  name: r'paginatedSearchRenderListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$paginatedSearchRenderListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PaginatedSearchRenderListRef
    = AutoDisposeProviderRef<AsyncValue<RenderList>>;
String _$paginatedSearchHash() => r'2aec3f3a3025c132ad7a82c435ed30b455de56f5';

/// See also [PaginatedSearch].
@ProviderFor(PaginatedSearch)
final paginatedSearchProvider =
    AutoDisposeAsyncNotifierProvider<PaginatedSearch, List<Asset>>.internal(
  PaginatedSearch.new,
  name: r'paginatedSearchProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$paginatedSearchHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$PaginatedSearch = AutoDisposeAsyncNotifier<List<Asset>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
