import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/table/asset/edit.drift.dart';
import 'package:immich_mobile/data/db/main/table/asset/ocr.drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/exif.drift.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late ProviderContainer container;

  setUp(() {
    ctx = MediumRepositoryContext();
    container = ProviderContainer(overrides: [driftProvider.overrideWithValue(ctx.db)]);
    addTearDown(container.dispose);
    addTearDown(ctx.dispose);
  });

  Future<void> insertText(String assetId) => ctx.db.assetOcrEntity.insertOne(
    AssetOcrEntityCompanion.insert(
      id: 'ocr',
      assetId: assetId,
      x1: 0.0975,
      y1: 0.134167,
      x2: 0.395,
      y2: 0.134167,
      x3: 0.395,
      y3: 0.235,
      x4: 0.0975,
      y4: 0.235,
      boxScore: 0.99,
      textScore: 0.98,
      recognizedText: 'ALPHA',
    ),
  );

  test('forAsset moves the text onto the edited image when the asset is edited', () async {
    final user = await ctx.newUser();
    final asset = await ctx.newRemoteAsset(ownerId: user.id);
    await ctx.db.remoteExifEntity.insertOne(
      RemoteExifEntityCompanion.insert(
        assetId: asset.id,
        width: const Value(1200),
        height: const Value(1600),
        orientation: const Value('6'),
      ),
    );
    await insertText(asset.id);

    final edited = Completer<Ocr>();

    final provider = Store.ocr.forAsset(asset.id);
    container.listen(provider, (_, next) {
      final box = next.valueOrNull?.single;
      if (box != null && box.x1 != 0.0975 && !edited.isCompleted) {
        edited.complete(box);
      }
    });
    expect((await container.read(provider.future)).single.x1, 0.0975);

    await ctx.db.assetEditEntity.insertAll([
      AssetEditEntityCompanion.insert(
        id: 'crop',
        assetId: asset.id,
        action: AssetEditAction.crop,
        parameters: {'x': 100, 'y': 80, 'width': 1000, 'height': 700},
        sequence: 0,
      ),
      AssetEditEntityCompanion.insert(
        id: 'rotate',
        assetId: asset.id,
        action: AssetEditAction.rotate,
        parameters: {'angle': 270},
        sequence: 1,
      ),
    ]);

    final box = await edited.future;

    // corners the server's OCR endpoint returns for the same box and edits
    expect(
      [box.x1, box.y1, box.x2, box.y2, box.x3, box.y3, box.x4, box.y4],
      [
        for (final value in [0.115715, 0.468, 0.288571, 0.468, 0.288571, 0.944, 0.115715, 0.944]) closeTo(value, 1e-6),
      ],
    );
  });

  test('forAsset drops the text the server hides', () async {
    final user = await ctx.newUser();
    final asset = await ctx.newRemoteAsset(ownerId: user.id);
    await insertText(asset.id);

    final hidden = Completer<void>();

    final provider = Store.ocr.forAsset(asset.id);
    container.listen(provider, (_, next) {
      if (next.valueOrNull?.isEmpty == true && !hidden.isCompleted) {
        hidden.complete();
      }
    });
    expect((await container.read(provider.future)).single.text, 'ALPHA');

    await (ctx.db.assetOcrEntity.update()..where((row) => row.id.equals('ocr'))).write(
      const AssetOcrEntityCompanion(isVisible: Value(false)),
    );

    await expectLater(hidden.future, completes);
  });
}
