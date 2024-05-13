// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_filter.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$getSearchSuggestionsHash() =>
    r'bc1e9a1a060868f14e6eb970d2251dbfe39c6866';

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

/// See also [getSearchSuggestions].
@ProviderFor(getSearchSuggestions)
const getSearchSuggestionsProvider = GetSearchSuggestionsFamily();

/// See also [getSearchSuggestions].
class GetSearchSuggestionsFamily extends Family<AsyncValue<List<String>>> {
  /// See also [getSearchSuggestions].
  const GetSearchSuggestionsFamily();

  /// See also [getSearchSuggestions].
  GetSearchSuggestionsProvider call(
    SearchSuggestionType type, {
    String? locationCountry,
    String? locationState,
    String? make,
    String? model,
  }) {
    return GetSearchSuggestionsProvider(
      type,
      locationCountry: locationCountry,
      locationState: locationState,
      make: make,
      model: model,
    );
  }

  @override
  GetSearchSuggestionsProvider getProviderOverride(
    covariant GetSearchSuggestionsProvider provider,
  ) {
    return call(
      provider.type,
      locationCountry: provider.locationCountry,
      locationState: provider.locationState,
      make: provider.make,
      model: provider.model,
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
  String? get name => r'getSearchSuggestionsProvider';
}

/// See also [getSearchSuggestions].
class GetSearchSuggestionsProvider
    extends AutoDisposeFutureProvider<List<String>> {
  /// See also [getSearchSuggestions].
  GetSearchSuggestionsProvider(
    SearchSuggestionType type, {
    String? locationCountry,
    String? locationState,
    String? make,
    String? model,
  }) : this._internal(
          (ref) => getSearchSuggestions(
            ref as GetSearchSuggestionsRef,
            type,
            locationCountry: locationCountry,
            locationState: locationState,
            make: make,
            model: model,
          ),
          from: getSearchSuggestionsProvider,
          name: r'getSearchSuggestionsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$getSearchSuggestionsHash,
          dependencies: GetSearchSuggestionsFamily._dependencies,
          allTransitiveDependencies:
              GetSearchSuggestionsFamily._allTransitiveDependencies,
          type: type,
          locationCountry: locationCountry,
          locationState: locationState,
          make: make,
          model: model,
        );

  GetSearchSuggestionsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.type,
    required this.locationCountry,
    required this.locationState,
    required this.make,
    required this.model,
  }) : super.internal();

  final SearchSuggestionType type;
  final String? locationCountry;
  final String? locationState;
  final String? make;
  final String? model;

  @override
  Override overrideWith(
    FutureOr<List<String>> Function(GetSearchSuggestionsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: GetSearchSuggestionsProvider._internal(
        (ref) => create(ref as GetSearchSuggestionsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        type: type,
        locationCountry: locationCountry,
        locationState: locationState,
        make: make,
        model: model,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<String>> createElement() {
    return _GetSearchSuggestionsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is GetSearchSuggestionsProvider &&
        other.type == type &&
        other.locationCountry == locationCountry &&
        other.locationState == locationState &&
        other.make == make &&
        other.model == model;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, type.hashCode);
    hash = _SystemHash.combine(hash, locationCountry.hashCode);
    hash = _SystemHash.combine(hash, locationState.hashCode);
    hash = _SystemHash.combine(hash, make.hashCode);
    hash = _SystemHash.combine(hash, model.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin GetSearchSuggestionsRef on AutoDisposeFutureProviderRef<List<String>> {
  /// The parameter `type` of this provider.
  SearchSuggestionType get type;

  /// The parameter `locationCountry` of this provider.
  String? get locationCountry;

  /// The parameter `locationState` of this provider.
  String? get locationState;

  /// The parameter `make` of this provider.
  String? get make;

  /// The parameter `model` of this provider.
  String? get model;
}

class _GetSearchSuggestionsProviderElement
    extends AutoDisposeFutureProviderElement<List<String>>
    with GetSearchSuggestionsRef {
  _GetSearchSuggestionsProviderElement(super.provider);

  @override
  SearchSuggestionType get type =>
      (origin as GetSearchSuggestionsProvider).type;
  @override
  String? get locationCountry =>
      (origin as GetSearchSuggestionsProvider).locationCountry;
  @override
  String? get locationState =>
      (origin as GetSearchSuggestionsProvider).locationState;
  @override
  String? get make => (origin as GetSearchSuggestionsProvider).make;
  @override
  String? get model => (origin as GetSearchSuggestionsProvider).model;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
