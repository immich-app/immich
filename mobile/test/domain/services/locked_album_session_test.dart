import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/locked_album.model.dart';
import 'package:immich_mobile/domain/services/locked_album_session.dart';
import 'package:immich_mobile/repositories/locked_album_api.repository.dart';
import 'package:openapi/api.dart';

final _album = LockedAlbum(
  id: 'synthetic-group',
  albumName: 'Synthetic group',
  createdAt: DateTime.utc(2026),
  updatedAt: DateTime.utc(2026),
  assetCount: 1,
);

LockedAlbumAccess _access(DateTime now) => LockedAlbumAccess(
  isElevated: true,
  expiresAt: now.add(const Duration(hours: 1)),
  pinExpiresAt: now.add(const Duration(minutes: 15)),
);

class _FakeRepository implements LockedAlbumRepository {
  Future<List<LockedAlbum>> Function() list = () async => [_album];
  Future<LockedAlbumAccess> Function() access = () async => _access(DateTime.now());
  Future<LockedAlbumAssetPage> Function() page = () async =>
      LockedAlbumAssetPage(assetIds: ['synthetic-asset'], hasNextPage: false);
  final additions = <List<String>>[];
  final removals = <List<String>>[];
  int deletes = 0;
  int statusCalls = 0;
  int listCalls = 0;

  @override
  Future<LockedAlbumAccess> getAccess() {
    statusCalls++;
    return access();
  }

  @override
  Future<List<LockedAlbum>> getAll() {
    listCalls++;
    return list();
  }

  @override
  Future<LockedAlbum> get(String id) async => _album;
  @override
  Future<LockedAlbum> create(String name) async => _album;
  @override
  Future<LockedAlbum> rename(String id, String name) async => _album;
  @override
  Future<void> delete(String id) async {
    deletes++;
  }

  @override
  Future<LockedAlbumAssetPage> getAssets(String id, {int skip = 0, int take = 50}) => page();
  @override
  Future<void> addAssets(String id, List<String> ids) async {
    additions.add(ids);
  }

  @override
  Future<void> removeAssets(String id, List<String> ids) async {
    removals.add(ids);
  }
}

void main() {
  test('late list results after lock or disposal never repopulate state', () async {
    for (final dispose in [false, true]) {
      final response = Completer<List<LockedAlbum>>();
      final started = Completer<void>();
      final repository = _FakeRepository()
        ..list = () {
          started.complete();
          return response.future;
        };
      final session = LockedAlbumSession(repository, onRevoked: () {});
      final pending = session.refresh();
      await started.future;
      if (dispose) {
        session.dispose();
      } else {
        session.clear();
      }
      response.complete([_album]);
      await pending;
      expect(session.albums, isEmpty);
      expect(session.isActive, isFalse);
      if (!dispose) {
        session.dispose();
      }
    }
  });

  test('late membership pages after background clear are discarded', () async {
    final response = Completer<LockedAlbumAssetPage>();
    final started = Completer<void>();
    final repository = _FakeRepository()
      ..page = () {
        started.complete();
        return response.future;
      };
    final session = LockedAlbumSession(repository, onRevoked: () {});
    final pending = session.select(_album);
    await started.future;
    session.clear();
    response.complete(LockedAlbumAssetPage(assetIds: ['private-id'], hasNextPage: true));
    await pending;
    expect(session.selected, isNull);
    expect(session.assetIds, isEmpty);
    expect(session.hasNextPage, isFalse);
    session.dispose();
  });

  for (final status in [401, 403]) {
    test('$status clears metadata and revokes exactly once', () async {
      final repository = _FakeRepository();
      var revocations = 0;
      final session = LockedAlbumSession(repository, onRevoked: () => revocations++);
      await session.refresh();
      await session.select(_album);
      repository.list = () async => throw ApiException(status, 'synthetic');
      await session.refresh();
      expect(session.albums, isEmpty);
      expect(session.assetIds, isEmpty);
      expect(session.selected, isNull);
      expect(revocations, 1);
      await session.refresh();
      expect(revocations, 1);
      session.dispose();
    });
  }

  test('expired elevation or failed status check fails closed', () async {
    for (final networkFailure in [false, true]) {
      final repository = _FakeRepository();
      final session = LockedAlbumSession(repository, onRevoked: () {});
      repository.access = () async {
        if (networkFailure) {
          throw StateError('synthetic offline');
        }
        return LockedAlbumAccess(
          isElevated: false,
          expiresAt: DateTime.now().add(const Duration(hours: 1)),
          pinExpiresAt: DateTime.now().subtract(const Duration(seconds: 1)),
        );
      };
      await session.refresh();
      expect(session.albums, isEmpty);
      expect(session.isActive, isFalse);
      expect(repository.listCalls, 0);
      session.dispose();
    }
  });

  for (final sessionExpiresFirst in [false, true]) {
    test('fixed ${sessionExpiresFirst ? 'session' : 'PIN'} deadline expires with no idle keepalive', () {
      fakeAsync((async) {
        final start = DateTime.utc(2026);
        final clock = async.getClock(start);
        final repository = _FakeRepository()
          ..access = () async => LockedAlbumAccess(
            isElevated: true,
            expiresAt: start.add(Duration(seconds: sessionExpiresFirst ? 60 : 120)),
            pinExpiresAt: start.add(Duration(seconds: sessionExpiresFirst ? 120 : 60)),
          );
        var revocations = 0;
        final session = LockedAlbumSession(repository, now: clock.now, onRevoked: () => revocations++);
        unawaited(session.refresh());
        async.flushMicrotasks();
        expect(session.albums, isNotEmpty);
        expect(session.deadline, start.add(const Duration(seconds: 60)));
        async.elapse(const Duration(seconds: 30));
        // Neither a repeated initializer nor explicit group activity may renew
        // status or the captured deadline, even if the server extends its PIN.
        unawaited(session.initialize());
        unawaited(session.refresh());
        async.flushMicrotasks();
        async.elapse(const Duration(seconds: 29, milliseconds: 999));
        expect(session.isActive, isTrue);
        expect(repository.statusCalls, 1);
        async.elapse(const Duration(milliseconds: 1));
        // Timer revocation and callback occur synchronously, not in a future.
        expect(revocations, 1);
        expect(session.albums, isEmpty);
        expect(session.selected, isNull);
        expect(session.assetIds, isEmpty);
        expect(session.isReady, isFalse);
        async.elapse(const Duration(hours: 1));
        expect(repository.statusCalls, 1);
        expect(revocations, 1);
        session.dispose();
      });
    });
  }

  test('deadline discards pending membership results and cannot be reopened', () {
    fakeAsync((async) {
      final start = DateTime.utc(2026);
      final clock = async.getClock(start);
      final response = Completer<LockedAlbumAssetPage>();
      final repository = _FakeRepository()
        ..access = (() async => _access(start))
        ..page = () => response.future;
      var revocations = 0;
      final session = LockedAlbumSession(repository, now: clock.now, onRevoked: () => revocations++);
      unawaited(session.refresh());
      async.flushMicrotasks();
      unawaited(session.select(_album));
      async.flushMicrotasks();
      expect(session.selected, isNotNull);
      expect(session.busy, isTrue);
      async.elapse(const Duration(minutes: 15));
      expect(revocations, 1);
      expect(session.selected, isNull);
      expect(session.albums, isEmpty);
      response.complete(LockedAlbumAssetPage(assetIds: ['late-private-id'], hasNextPage: true));
      async.flushMicrotasks();
      unawaited(session.initialize());
      unawaited(session.refresh());
      async.flushMicrotasks();
      expect(session.assetIds, isEmpty);
      expect(session.hasNextPage, isFalse);
      expect(session.isActive, isFalse);
      expect(repository.statusCalls, 1);
      expect(repository.listCalls, 1);
      session.dispose();
    });
  });

  test('fixed timer still expires if wall clock moves backward', () {
    fakeAsync((async) {
      final start = DateTime.utc(2026);
      var now = start;
      final repository = _FakeRepository()..access = () async => _access(start);
      var revocations = 0;
      final session = LockedAlbumSession(repository, now: () => now, onRevoked: () => revocations++);
      unawaited(session.refresh());
      async.flushMicrotasks();
      now = start.subtract(const Duration(days: 1));
      async.elapse(const Duration(minutes: 15));
      expect(session.isActive, isFalse);
      expect(session.albums, isEmpty);
      expect(revocations, 1);
      expect(repository.statusCalls, 1);
      session.dispose();
    });
  });

  test('results past deadline are rejected even before the timer callback runs', () {
    fakeAsync((async) {
      final start = DateTime.utc(2026);
      var now = start;
      final response = Completer<List<LockedAlbum>>();
      final repository = _FakeRepository()
        ..access = (() async => _access(start))
        ..list = () => response.future;
      var revocations = 0;
      final session = LockedAlbumSession(repository, now: () => now, onRevoked: () => revocations++);
      unawaited(session.refresh());
      async.flushMicrotasks();
      // Simulate forward wall-clock movement, without pumping the local timer.
      now = start.add(const Duration(minutes: 15));
      expect(session.isReady, isFalse);
      response.complete([_album]);
      async.flushMicrotasks();
      expect(session.albums, isEmpty);
      expect(session.isActive, isFalse);
      expect(revocations, 1);
      session.dispose();
    });
  });

  test('initial status completing after background/disposal cannot start a deadline', () {
    for (final dispose in [false, true]) {
      fakeAsync((async) {
        final start = DateTime.utc(2026);
        final response = Completer<LockedAlbumAccess>();
        final repository = _FakeRepository()..access = () => response.future;
        var revocations = 0;
        final session = LockedAlbumSession(repository, now: async.getClock(start).now, onRevoked: () => revocations++);
        unawaited(session.initialize());
        async.flushMicrotasks();
        if (dispose) {
          session.dispose();
        } else {
          session.clear();
        }
        response.complete(_access(start));
        async.flushMicrotasks();
        async.elapse(const Duration(hours: 1));
        expect(session.isReady, isFalse);
        expect(session.deadline, isNull);
        expect(revocations, 0);
        expect(repository.listCalls, 0);
        if (!dispose) {
          session.dispose();
        }
      });
    }
  });

  test('expired/missing/invalid dates fail closed before group metadata requests', () {
    final start = DateTime.utc(2026);
    final valid = start.add(const Duration(minutes: 15)).toIso8601String();
    final invalidStatuses = <Map<String, dynamic>>[
      {'isElevated': true, 'expiresAt': valid},
      {'isElevated': true, 'pinExpiresAt': valid},
      {'isElevated': true, 'expiresAt': valid, 'pinExpiresAt': 'not-a-date'},
      {'isElevated': true, 'expiresAt': valid, 'pinExpiresAt': '2026-02-30T00:00:00.000Z'},
      {'isElevated': true, 'expiresAt': valid, 'pinExpiresAt': '2026-01-01T00:00:00'},
      {'isElevated': true, 'expiresAt': valid, 'pinExpiresAt': start.toIso8601String()},
      {'isElevated': true, 'expiresAt': start.toIso8601String(), 'pinExpiresAt': valid},
    ];
    for (final status in invalidStatuses) {
      fakeAsync((async) {
        final repository = _FakeRepository()..access = () async => LockedAlbumAccess.fromJson(status);
        var revocations = 0;
        final session = LockedAlbumSession(repository, now: async.getClock(start).now, onRevoked: () => revocations++);
        unawaited(session.refresh());
        async.flushMicrotasks();
        expect(session.isActive, isFalse);
        expect(session.albums, isEmpty);
        expect(repository.statusCalls, 1);
        expect(repository.listCalls, 0);
        expect(revocations, 1);
        session.dispose();
      });
    }
  });

  test('initial status timeout and its late completion cannot reveal metadata', () {
    fakeAsync((async) {
      final start = DateTime.utc(2026);
      final response = Completer<LockedAlbumAccess>();
      final repository = _FakeRepository()..access = () => response.future;
      var revocations = 0;
      final session = LockedAlbumSession(repository, now: async.getClock(start).now, onRevoked: () => revocations++);
      unawaited(session.refresh());
      async.flushMicrotasks();
      expect(session.isReady, isFalse);
      expect(repository.listCalls, 0);
      async.elapse(const Duration(seconds: 4));
      expect(revocations, 1);
      response.complete(_access(start));
      async.flushMicrotasks();
      expect(session.isReady, isFalse);
      expect(repository.statusCalls, 1);
      expect(repository.listCalls, 0);
      session.dispose();
    });
  });

  test('membership mutations and group deletion never mutate ordinary albums', () async {
    final repository = _FakeRepository();
    final session = LockedAlbumSession(repository, onRevoked: () {});
    await session.refresh();
    await session.select(_album);
    await session.changeMembership(['synthetic-asset'], add: true);
    await session.changeMembership(['synthetic-asset'], add: false);
    expect(repository.additions.single, ['synthetic-asset']);
    expect(repository.removals.single, ['synthetic-asset']);
    await session.deleteSelected();
    expect(repository.deletes, 1);
    expect(session.albums, isEmpty);
    expect(session.assetIds, isEmpty);
    session.dispose();
  });
}
