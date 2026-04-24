import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/metadata_kind.dart';
import 'package:immich_mobile/domain/models/metadata_value.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';

class CachedMetadataRepository {
  final MetadataRepository _repository;
  final Map<MetadataKind, MetadataValue> _cache = {};

  CachedMetadataRepository._(this._repository);

  static CachedMetadataRepository? _instance;
  static CachedMetadataRepository get instance {
    if (_instance == null) {
      throw UnsupportedError('CachedMetadataRepository not initialized. Call ensureInitialized() first');
    }
    return _instance!;
  }

  static Future<CachedMetadataRepository> ensureInitialized({required MetadataRepository repository}) async {
    if (_instance == null) {
      final instance = CachedMetadataRepository._(repository);
      await instance._hydrate();
      _instance = instance;
    }
    return _instance!;
  }

  Future<void> _hydrate() async {
    for (final kind in MetadataKind.values) {
      _cache[kind] = await _repository.get(kind);
    }
  }

  T read<T extends MetadataValue>(MetadataKind<T> kind) => (_cache[kind] as T?) ?? kind.defaultValue;

  Future<void> update<T extends MetadataValue>(MetadataKind<T> kind, T Function(T current) mutator) async {
    final current = read(kind);
    final updated = mutator(current);
    if (_cache[kind] == updated) return;
    await _repository.set(kind, updated);
    _cache[kind] = updated;
  }

  Future<void> setAppConfig(AppConfig Function(AppConfig current) mutator) {
    return update(MetadataKind.appConfig, (c) => mutator.call(c));
  }

  Future<void> clear<T extends MetadataValue>(MetadataKind<T> kind) async {
    await _repository.delete(kind);
    _cache[kind] = kind.defaultValue;
  }

  Stream<T> watch<T extends MetadataValue>(MetadataKind<T> kind) => _repository.watch(kind);
}
