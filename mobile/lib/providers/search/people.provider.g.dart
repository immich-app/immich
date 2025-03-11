// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'people.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$getAllPeopleHash() => r'226947af3b09ce62224916543958dd1d5e2ba651';

/// See also [getAllPeople].
@ProviderFor(getAllPeople)
final getAllPeopleProvider = AutoDisposeFutureProvider<List<Person>>.internal(
  getAllPeople,
  name: r'getAllPeopleProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$getAllPeopleHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef GetAllPeopleRef = AutoDisposeFutureProviderRef<List<Person>>;
String _$personAssetsHash() => r'c1d35ee0e024bd6915e21bc724be4b458a14bc24';

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

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
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

String _$updatePersonNameHash() => r'45f7693172de522a227406d8198811434cf2bbbc';

/// See also [updatePersonName].
@ProviderFor(updatePersonName)
const updatePersonNameProvider = UpdatePersonNameFamily();

/// See also [updatePersonName].
class UpdatePersonNameFamily extends Family<AsyncValue<bool>> {
  /// See also [updatePersonName].
  const UpdatePersonNameFamily();

  /// See also [updatePersonName].
  UpdatePersonNameProvider call(
    String personId,
    String updatedName,
  ) {
    return UpdatePersonNameProvider(
      personId,
      updatedName,
    );
  }

  @override
  UpdatePersonNameProvider getProviderOverride(
    covariant UpdatePersonNameProvider provider,
  ) {
    return call(
      provider.personId,
      provider.updatedName,
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
class UpdatePersonNameProvider extends AutoDisposeFutureProvider<bool> {
  /// See also [updatePersonName].
  UpdatePersonNameProvider(
    String personId,
    String updatedName,
  ) : this._internal(
          (ref) => updatePersonName(
            ref as UpdatePersonNameRef,
            personId,
            updatedName,
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
          personId: personId,
          updatedName: updatedName,
        );

  UpdatePersonNameProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.personId,
    required this.updatedName,
  }) : super.internal();

  final String personId;
  final String updatedName;

  @override
  Override overrideWith(
    FutureOr<bool> Function(UpdatePersonNameRef provider) create,
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
        personId: personId,
        updatedName: updatedName,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<bool> createElement() {
    return _UpdatePersonNameProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is UpdatePersonNameProvider &&
        other.personId == personId &&
        other.updatedName == updatedName;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, personId.hashCode);
    hash = _SystemHash.combine(hash, updatedName.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin UpdatePersonNameRef on AutoDisposeFutureProviderRef<bool> {
  /// The parameter `personId` of this provider.
  String get personId;

  /// The parameter `updatedName` of this provider.
  String get updatedName;
}

class _UpdatePersonNameProviderElement
    extends AutoDisposeFutureProviderElement<bool> with UpdatePersonNameRef {
  _UpdatePersonNameProviderElement(super.provider);

  @override
  String get personId => (origin as UpdatePersonNameProvider).personId;
  @override
  String get updatedName => (origin as UpdatePersonNameProvider).updatedName;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
