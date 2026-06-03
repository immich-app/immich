import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
// ignore: depend_on_referenced_packages
import 'package:meta/meta.dart';

abstract class CachedKeyValueRepository<K extends Enum, S> {
  CachedKeyValueRepository(this._snapshot);

  S _snapshot;
  S get snapshot => _snapshot;
  @protected
  set snapshot(S value) => _snapshot = value;

  List<K> get keys;

  Object decodeValue(K key, String raw);

  S buildSnapshot(Map<K, Object> overrides);

  Selectable<({String key, String value})> selectable();

  Future<void> refresh() async => _snapshot = _build(await selectable().get());

  Stream<S> watchSnapshot() => selectable().watch().map((rows) => _snapshot = _build(rows));

  S _build(List<({String key, String value})> rows) {
    final overrides = <K, Object>{};
    for (final row in rows) {
      final key = keys.firstWhereOrNull((k) => k.name == row.key);
      if (key == null) {
        continue;
      }
      overrides[key] = decodeValue(key, row.value);
    }
    return buildSnapshot(overrides);
  }
}
