import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/locked_album.model.dart';
import 'package:immich_mobile/domain/services/locked_album_session.dart';
import 'package:immich_mobile/presentation/widgets/locked_album_photos.widget.dart';
import 'package:immich_mobile/repositories/locked_album_api.repository.dart';
import 'package:openapi/api.dart' show ApiException;

final _album = LockedAlbum(id: 'group', albumName: 'Test', createdAt: _date, updatedAt: _date, assetCount: 1);
final _date = DateTime.utc(2026);

class _Repository implements LockedAlbumRepository {
  final added = <String>[];
  final removed = <String>[];
  @override
  Future<LockedAlbumAccess> getAccess() async => LockedAlbumAccess(
    isElevated: true,
    expiresAt: DateTime.now().add(const Duration(hours: 1)),
    pinExpiresAt: DateTime.now().add(const Duration(minutes: 15)),
  );
  @override
  Future<LockedAlbumAssetPage> getAssets(String id, {int skip = 0, int take = 50}) async =>
      LockedAlbumAssetPage(assetIds: ['photo'], hasNextPage: false);
  @override
  Future<List<LockedAlbum>> getAll() async => [_album];
  @override
  Future<void> addAssets(String id, List<String> ids) async => added.addAll(ids);
  @override
  Future<void> removeAssets(String id, List<String> ids) async => removed.addAll(ids);
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

RemoteAsset _asset(String id, {String owner = 'owner', AssetVisibility visibility = AssetVisibility.locked}) =>
    RemoteAsset(
      id: id,
      ownerId: owner,
      name: 'Synthetic',
      checksum: null,
      type: AssetType.image,
      createdAt: _date,
      updatedAt: _date,
      isEdited: false,
      visibility: visibility,
    );

final _png = base64Decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4AWP8DwQMQMDEAAUAPfgEADYYS7QAAAAASUVORK5CYII=',
);

void main() {
  for (final add in [true, false]) {
    testWidgets('visual selection ${add ? 'adds' : 'removes'} membership only', (tester) async {
      final repository = _Repository();
      final session = LockedAlbumSession(repository, onRevoked: () {});
      await session.select(_album);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: LockedAlbumPhotos(
                session: session,
                ownerId: 'owner',
                add: add,
                load: (_) async => [
                  _asset('photo'),
                  _asset('foreign', owner: 'other'),
                  _asset('public', visibility: AssetVisibility.timeline),
                ],
                thumbnail: (_) async => Uint8List(0),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byKey(const ValueKey('locked-photo-foreign')), findsNothing);
      expect(find.byKey(const ValueKey('locked-photo-public')), findsNothing);
      await tester.tap(find.byKey(const ValueKey('locked-photo-photo')));
      await tester.pump();
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      await tester.tap(find.text('${add ? 'Add' : 'Remove'} 1 selected'));
      await tester.pumpAndSettle();
      expect(add ? repository.added : repository.removed, ['photo']);
      session.revoke();
      await tester.pump();
      expect(find.byKey(const ValueKey('locked-photo-photo')), findsNothing);
      await tester.pumpWidget(const SizedBox());
      session.dispose();
    });
  }

  testWidgets('late asset list after relock does not recreate selection', (tester) async {
    final session = LockedAlbumSession(_Repository(), onRevoked: () {});
    await session.initialize();
    final pending = Completer<List<RemoteAsset>>();
    var thumbnails = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: LockedAlbumPhotos(
          session: session,
          ownerId: 'owner',
          add: true,
          load: (_) => pending.future,
          thumbnail: (_) async {
            thumbnails++;
            return _png;
          },
        ),
      ),
    );
    session.revoke();
    pending.complete([_asset('photo')]);
    await tester.pumpAndSettle();
    expect(find.byType(InkWell), findsNothing);
    expect(thumbnails, 0);
    await tester.pumpWidget(const SizedBox());
    session.dispose();
  });

  testWidgets('late preview after relock never paints or enters image cache', (tester) async {
    final session = LockedAlbumSession(_Repository(), onRevoked: () {});
    await session.initialize();
    final pending = Completer<Uint8List>();
    final cacheSize = PaintingBinding.instance.imageCache.currentSize;
    await tester.pumpWidget(
      MaterialApp(
        home: LockedAlbumPreview(session: session, load: () => pending.future),
      ),
    );
    session.revoke();
    pending.complete(_png);
    await tester.pumpAndSettle();
    expect(find.byType(RawImage), findsNothing);
    expect(PaintingBinding.instance.imageCache.currentSize, cacheSize);
    await tester.pumpWidget(const SizedBox());
    session.dispose();
  });

  testWidgets('preview authorization failure relocks the session', (tester) async {
    var revoked = false;
    final session = LockedAlbumSession(_Repository(), onRevoked: () => revoked = true);
    await session.initialize();
    await tester.pumpWidget(
      MaterialApp(
        home: LockedAlbumPreview(session: session, load: () async => throw ApiException(403, 'Synthetic')),
      ),
    );
    await tester.pumpAndSettle();
    expect(revoked, isTrue);
    expect(find.byType(RawImage), findsNothing);
    await tester.pumpWidget(const SizedBox());
    session.dispose();
  });

  testWidgets('an authorized preview renders without entering the shared image cache', (tester) async {
    await tester.runAsync(() async {
      final codec = await ui.instantiateImageCodec(_png);
      final frame = await codec.getNextFrame();
      frame.image.dispose();
      codec.dispose();
    });
    final session = LockedAlbumSession(_Repository(), onRevoked: () {});
    await session.initialize();
    final cacheSize = PaintingBinding.instance.imageCache.currentSize;
    await tester.pumpWidget(
      MaterialApp(
        home: LockedAlbumPreview(session: session, load: () async => _png),
      ),
    );
    // Native image decoding is not driven by the fake widget-test clock.
    // Yield to that event loop and pump until the decoded frame is available,
    // rather than assuming pumpAndSettle waits for an unscheduled native future.
    await tester.runAsync(() async {
      for (var attempt = 0; attempt < 100 && find.byType(RawImage).evaluate().isEmpty; attempt++) {
        await tester.pump();
        await Future<void>.delayed(const Duration(milliseconds: 10));
      }
    });
    await tester.pump();
    expect(find.byType(RawImage), findsOneWidget);
    expect(PaintingBinding.instance.imageCache.currentSize, cacheSize);
    session.revoke();
    await tester.pump();
    expect(find.byType(RawImage), findsNothing);
    await tester.pumpWidget(const SizedBox());
    session.dispose();
  });
}
