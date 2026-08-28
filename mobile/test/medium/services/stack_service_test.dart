import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/table/local/asset.drift.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/services/stack.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../repository.mocks.dart';
import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late MockAssetApiRepository api;
  late StackService sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    api = MockAssetApiRepository();
    sut = StackService(LocalAssetRepository(ctx.db), api);
    when(
      () => api.stack(any()),
    ).thenAnswer((_) async => const StackResponse(id: 'stack', primaryAssetId: 'edit', assetIds: ['edit', 'original']));
  });

  tearDown(() => ctx.dispose());

  Future<void> setPrior(String id, String checksum) {
    final query = ctx.db.update(ctx.db.localAssetEntity)..where((row) => row.id.equals(id));
    return query.write(LocalAssetEntityCompanion(priorChecksum: Value(checksum)));
  }

  test('stacks the upload over the owned remote with the prior checksum', () async {
    final me = (await ctx.newUser()).id;
    await ctx.newAuthUser(id: me);
    final original = await ctx.newRemoteAsset(ownerId: me, checksum: 'a');
    await ctx.newRemoteAsset(ownerId: (await ctx.newUser()).id, checksum: 'z');
    final edited = await ctx.newLocalAsset(checksum: 'b');
    final partnerEdited = await ctx.newLocalAsset(checksum: 'c');
    await setPrior(edited.id, 'a');
    await setPrior(partnerEdited.id, 'z');

    await sut.afterUpload(edited.id, 'edit');
    await sut.afterUpload(partnerEdited.id, 'other');

    verify(() => api.stack(['edit', original.id])).called(1);
    verifyNoMoreInteractions(api);
  });
}
