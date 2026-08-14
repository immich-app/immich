import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late PartnerRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = PartnerRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('search', () {
    test('sharedBy returns users the current user shares their library to', () async {
      final me = await ctx.newUser();
      final recipient = await ctx.newUser();
      final sharer = await ctx.newUser();
      await ctx.newPartner(sharedById: me.id, sharedWithId: recipient.id);
      await ctx.newPartner(sharedById: sharer.id, sharedWithId: me.id);

      final result = await sut.search(me.id, .sharedBy).first;

      expect(result.map((partner) => partner.id), unorderedEquals([recipient.id]));
    });

    test('sharedWith returns users sharing their library with the current user', () async {
      final me = await ctx.newUser();
      final recipient = await ctx.newUser();
      final sharer = await ctx.newUser();
      await ctx.newPartner(sharedById: me.id, sharedWithId: recipient.id);
      await ctx.newPartner(sharedById: sharer.id, sharedWithId: me.id);

      final result = await sut.search(me.id, .sharedWith).first;

      expect(result.map((partner) => partner.id), unorderedEquals([sharer.id]));
    });

    test('emits an updated list when a new partner is added', () async {
      final me = await ctx.newUser();
      final recipient = await ctx.newUser();

      final ids = sut.search(me.id, .sharedBy).map((partners) => partners.map((p) => p.id).toList());
      final expectation = expectLater(
        ids,
        emitsInOrder([
          isEmpty,
          unorderedEquals([recipient.id]),
        ]),
      );

      await ctx.newPartner(sharedById: me.id, sharedWithId: recipient.id);
      await expectation;
    });
  });

  group('create', () {
    test('inserts a partnership with the current user as the sharer and inTimeline disabled', () async {
      final me = await ctx.newUser();
      final partner = await ctx.newUser();

      await sut.create(sharedById: me.id, sharedWithId: partner.id);

      final result = (await sut.search(me.id, .sharedBy).first).first;
      expect(result.id, partner.id);
      expect(result.inTimeline, isFalse);
    });
  });

  group('update', () {
    test('toggles the inTimeline flag for an existing partnership', () async {
      final me = await ctx.newUser();
      final sharer = await ctx.newUser();
      await ctx.newPartner(sharedById: sharer.id, sharedWithId: me.id, inTimeline: false);

      await sut.update(sharedById: sharer.id, sharedWithId: me.id, inTimeline: true);

      final result = await sut.get(sharedById: sharer.id, sharedWithId: me.id);
      expect(result.inTimeline, isTrue);
    });
  });

  group('delete', () {
    test('removes the partnership the current user shares by', () async {
      final me = await ctx.newUser();
      final recipient = await ctx.newUser();
      await ctx.newPartner(sharedById: me.id, sharedWithId: recipient.id);

      await sut.delete(sharedById: me.id, sharedWithId: recipient.id);

      final rows = await ctx.db.select(ctx.db.partnerEntity).get();
      expect(rows, isEmpty);
    });
  });
}
