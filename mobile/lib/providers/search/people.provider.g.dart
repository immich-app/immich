// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'people.provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$getAllPeopleHash() => r'cae10fb6b8dd3aedab7d750ae2e3095a87b7ae3d';

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

/// See also [getAllPeople].
@ProviderFor(getAllPeople)
const getAllPeopleProvider = GetAllPeopleFamily();

/// See also [getAllPeople].
class GetAllPeopleFamily extends Family<AsyncValue<List<Person>>> {
  /// See also [getAllPeople].
  const GetAllPeopleFamily();

  /// See also [getAllPeople].
  GetAllPeopleProvider call({
    bool withHidden = false,
  }) {
    return GetAllPeopleProvider(
      withHidden: withHidden,
    );
  }

  @override
  GetAllPeopleProvider getProviderOverride(
    covariant GetAllPeopleProvider provider,
  ) {
    return call(
      withHidden: provider.withHidden,
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
  String? get name => r'getAllPeopleProvider';
}

/// See also [getAllPeople].
class GetAllPeopleProvider extends AutoDisposeFutureProvider<List<Person>> {
  /// See also [getAllPeople].
  GetAllPeopleProvider({
    bool withHidden = false,
  }) : this._internal(
          (ref) => getAllPeople(
            ref as GetAllPeopleRef,
            withHidden: withHidden,
          ),
          from: getAllPeopleProvider,
          name: r'getAllPeopleProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$getAllPeopleHash,
          dependencies: GetAllPeopleFamily._dependencies,
          allTransitiveDependencies:
              GetAllPeopleFamily._allTransitiveDependencies,
          withHidden: withHidden,
        );

  GetAllPeopleProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.withHidden,
  }) : super.internal();

  final bool withHidden;

  @override
  Override overrideWith(
    FutureOr<List<Person>> Function(GetAllPeopleRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: GetAllPeopleProvider._internal(
        (ref) => create(ref as GetAllPeopleRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        withHidden: withHidden,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Person>> createElement() {
    return _GetAllPeopleProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is GetAllPeopleProvider && other.withHidden == withHidden;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, withHidden.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin GetAllPeopleRef on AutoDisposeFutureProviderRef<List<Person>> {
  /// The parameter `withHidden` of this provider.
  bool get withHidden;
}

class _GetAllPeopleProviderElement
    extends AutoDisposeFutureProviderElement<List<Person>>
    with GetAllPeopleRef {
  _GetAllPeopleProviderElement(super.provider);

  @override
  bool get withHidden => (origin as GetAllPeopleProvider).withHidden;
}

String _$personAssetsHash() => r'c1d35ee0e024bd6915e21bc724be4b458a14bc24';

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

String _$updatePersonIsHiddenHash() =>
    r'7c4fbe3f7af047e0520b53754806382e8b837c61';

/// See also [updatePersonIsHidden].
@ProviderFor(updatePersonIsHidden)
const updatePersonIsHiddenProvider = UpdatePersonIsHiddenFamily();

/// See also [updatePersonIsHidden].
class UpdatePersonIsHiddenFamily extends Family<AsyncValue<bool>> {
  /// See also [updatePersonIsHidden].
  const UpdatePersonIsHiddenFamily();

  /// See also [updatePersonIsHidden].
  UpdatePersonIsHiddenProvider call(
    String personId,
    bool isHidden,
  ) {
    return UpdatePersonIsHiddenProvider(
      personId,
      isHidden,
    );
  }

  @override
  UpdatePersonIsHiddenProvider getProviderOverride(
    covariant UpdatePersonIsHiddenProvider provider,
  ) {
    return call(
      provider.personId,
      provider.isHidden,
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
  String? get name => r'updatePersonIsHiddenProvider';
}

/// See also [updatePersonIsHidden].
class UpdatePersonIsHiddenProvider extends AutoDisposeFutureProvider<bool> {
  /// See also [updatePersonIsHidden].
  UpdatePersonIsHiddenProvider(
    String personId,
    bool isHidden,
  ) : this._internal(
          (ref) => updatePersonIsHidden(
            ref as UpdatePersonIsHiddenRef,
            personId,
            isHidden,
          ),
          from: updatePersonIsHiddenProvider,
          name: r'updatePersonIsHiddenProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$updatePersonIsHiddenHash,
          dependencies: UpdatePersonIsHiddenFamily._dependencies,
          allTransitiveDependencies:
              UpdatePersonIsHiddenFamily._allTransitiveDependencies,
          personId: personId,
          isHidden: isHidden,
        );

  UpdatePersonIsHiddenProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.personId,
    required this.isHidden,
  }) : super.internal();

  final String personId;
  final bool isHidden;

  @override
  Override overrideWith(
    FutureOr<bool> Function(UpdatePersonIsHiddenRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: UpdatePersonIsHiddenProvider._internal(
        (ref) => create(ref as UpdatePersonIsHiddenRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        personId: personId,
        isHidden: isHidden,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<bool> createElement() {
    return _UpdatePersonIsHiddenProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is UpdatePersonIsHiddenProvider &&
        other.personId == personId &&
        other.isHidden == isHidden;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, personId.hashCode);
    hash = _SystemHash.combine(hash, isHidden.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin UpdatePersonIsHiddenRef on AutoDisposeFutureProviderRef<bool> {
  /// The parameter `personId` of this provider.
  String get personId;

  /// The parameter `isHidden` of this provider.
  bool get isHidden;
}

class _UpdatePersonIsHiddenProviderElement
    extends AutoDisposeFutureProviderElement<bool>
    with UpdatePersonIsHiddenRef {
  _UpdatePersonIsHiddenProviderElement(super.provider);

  @override
  String get personId => (origin as UpdatePersonIsHiddenProvider).personId;
  @override
  bool get isHidden => (origin as UpdatePersonIsHiddenProvider).isHidden;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
