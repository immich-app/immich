// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'people.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$personAssetsHash() => r'6365a957da89dd7c1c2cf495633f1a5ef57dd69d';

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

/// See also [personAssets].
@ProviderFor(personAssets)
const personAssetsProvider = PersonAssetsFamily();

/// See also [personAssets].
class PersonAssetsFamily extends Family<AsyncValue<RenderList>> {
  /// See also [personAssets].
  const PersonAssetsFamily();

  /// See also [personAssets].
  PersonAssetsProvider call(
    String personId,
  ) {
    return PersonAssetsProvider(
      personId,
    );
  }

  @override
  PersonAssetsProvider getProviderOverride(
    covariant PersonAssetsProvider provider,
  ) {
    return call(
      provider.personId,
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
  String? get name => r'personAssetsProvider';
}

/// See also [personAssets].
class PersonAssetsProvider extends AutoDisposeFutureProvider<RenderList> {
  /// See also [personAssets].
  PersonAssetsProvider(
    String personId,
  ) : this._internal(
          (ref) => personAssets(
            ref as PersonAssetsRef,
            personId,
          ),
          from: personAssetsProvider,
          name: r'personAssetsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$personAssetsHash,
          dependencies: PersonAssetsFamily._dependencies,
          allTransitiveDependencies:
              PersonAssetsFamily._allTransitiveDependencies,
          personId: personId,
        );

  PersonAssetsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.personId,
  }) : super.internal();

  final String personId;

  @override
  Override overrideWith(
    FutureOr<RenderList> Function(PersonAssetsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PersonAssetsProvider._internal(
        (ref) => create(ref as PersonAssetsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        personId: personId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<RenderList> createElement() {
    return _PersonAssetsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PersonAssetsProvider && other.personId == personId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, personId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PersonAssetsRef on AutoDisposeFutureProviderRef<RenderList> {
  /// The parameter `personId` of this provider.
  String get personId;
}

class _PersonAssetsProviderElement
    extends AutoDisposeFutureProviderElement<RenderList> with PersonAssetsRef {
  _PersonAssetsProviderElement(super.provider);

  @override
  String get personId => (origin as PersonAssetsProvider).personId;
}

String _$getCuratedPeopleHash() => r'290c4374ab205319f42fed6682eebf7db0bac39f';

/// See also [getCuratedPeople].
@ProviderFor(getCuratedPeople)
final getCuratedPeopleProvider =
    AutoDisposeFutureProvider<List<CuratedContent>>.internal(
  getCuratedPeople,
  name: r'getCuratedPeopleProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$getCuratedPeopleHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef GetCuratedPeopleRef
    = AutoDisposeFutureProviderRef<List<CuratedContent>>;
String _$updatePersonNameHash() => r'8026619b65d713ac6d5cd46b071074a46df99fef';

/// See also [updatePersonName].
@ProviderFor(updatePersonName)
const updatePersonNameProvider = UpdatePersonNameFamily();

/// See also [updatePersonName].
class UpdatePersonNameFamily extends Family<void> {
  /// See also [updatePersonName].
  const UpdatePersonNameFamily();

  /// See also [updatePersonName].
  UpdatePersonNameProvider call(
    String id,
    String personName,
  ) {
    return UpdatePersonNameProvider(
      id,
      personName,
    );
  }

  @override
  UpdatePersonNameProvider getProviderOverride(
    covariant UpdatePersonNameProvider provider,
  ) {
    return call(
      provider.id,
      provider.personName,
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
  String? get name => r'updatePersonNameProvider';
}

/// See also [updatePersonName].
class UpdatePersonNameProvider extends AutoDisposeProvider<void> {
  /// See also [updatePersonName].
  UpdatePersonNameProvider(
    String id,
    String personName,
  ) : this._internal(
          (ref) => updatePersonName(
            ref as UpdatePersonNameRef,
            id,
            personName,
          ),
          from: updatePersonNameProvider,
          name: r'updatePersonNameProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$updatePersonNameHash,
          dependencies: UpdatePersonNameFamily._dependencies,
          allTransitiveDependencies:
              UpdatePersonNameFamily._allTransitiveDependencies,
          id: id,
          personName: personName,
        );

  UpdatePersonNameProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
    required this.personName,
  }) : super.internal();

  final String id;
  final String personName;

  @override
  Override overrideWith(
    void Function(UpdatePersonNameRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: UpdatePersonNameProvider._internal(
        (ref) => create(ref as UpdatePersonNameRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
        personName: personName,
      ),
    );
  }

  @override
  AutoDisposeProviderElement<void> createElement() {
    return _UpdatePersonNameProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is UpdatePersonNameProvider &&
        other.id == id &&
        other.personName == personName;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);
    hash = _SystemHash.combine(hash, personName.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin UpdatePersonNameRef on AutoDisposeProviderRef<void> {
  /// The parameter `id` of this provider.
  String get id;

  /// The parameter `personName` of this provider.
  String get personName;
}

class _UpdatePersonNameProviderElement extends AutoDisposeProviderElement<void>
    with UpdatePersonNameRef {
  _UpdatePersonNameProviderElement(super.provider);

  @override
  String get id => (origin as UpdatePersonNameProvider).id;
  @override
  String get personName => (origin as UpdatePersonNameProvider).personName;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
