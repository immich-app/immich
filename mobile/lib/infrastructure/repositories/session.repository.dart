import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/session.model.dart';
import 'package:immich_mobile/infrastructure/entities/session.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/cached_key_value_repository.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class SessionRepository extends CachedKeyValueRepository<SessionKey, Session> {
  final Drift _db;

  SessionRepository._(this._db) : super(const .new());

  static SessionRepository? _instance;

  static SessionRepository get instance {
    final instance = _instance;
    if (instance == null) {
      throw StateError('SessionRepository not initialized. Call ensureInitialized() first');
    }
    return instance;
  }

  static Future<SessionRepository> ensureInitialized(Drift db) async {
    if (_instance == null) {
      final instance = SessionRepository._(db);
      await instance.refresh();
      _instance = instance;
    }
    return _instance!;
  }

  @override
  List<SessionKey> get keys => SessionKey.values;

  @override
  Object decodeValue(SessionKey key, String raw) => key.decode(raw);

  @override
  Session buildSnapshot(Map<SessionKey, Object?> overrides) => Session.fromEntries(overrides);

  @override
  @protected
  Selectable<({String key, String? value})> selectable() =>
      _db.select(_db.sessionEntity).map((row) => (key: row.key, value: row.value));

  Session get session => snapshot;

  Future<void> clear(Iterable<SessionKey> keys) async {
    if (keys.isEmpty) {
      return;
    }

    final names = keys.map((key) => key.name).toList();
    await (_db.delete(_db.sessionEntity)..where((row) => row.key.isIn(names))).go();

    var session = snapshot;
    for (final key in keys) {
      session = session.write(key, defaultSession.read(key));
    }
    snapshot = session;
  }

  Future<void> write<T, U extends T>(SessionKey<T> key, U value) async {
    if (value == snapshot.read(key)) {
      return;
    }

    String? resolvedValue;
    if (value != null) {
      resolvedValue = key.encode(value);
    }

    await _db
        .into(_db.sessionEntity)
        .insertOnConflictUpdate(
          SessionEntityCompanion.insert(key: key.name, value: .new(resolvedValue), updatedAt: .new(DateTime.now())),
        );
    snapshot = snapshot.write(key, value);
  }

  Stream<Session> watch() => watchSnapshot();
}
