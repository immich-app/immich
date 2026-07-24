import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:mocktail/mocktail.dart';

import '../service_context.dart';

void main() {
  late MediumServiceContext ctx;
  late PartnerService sut;

  setUp(() async {
    ctx = await MediumServiceContext.init();
    sut = PartnerService(ctx.userRepository, ctx.partnerRepository, ctx.partnerApi);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getCandidates', () {
    test('returns the other users and excludes the current user', () async {
      final me = await ctx.newUser();
      final other = await ctx.newUser();

      final result = await sut.getCandidates(me.id).first;

      expect(result.map((user) => user.id), unorderedEquals([other.id]));
    });

    test('excludes users the current user already shares with', () async {
      final me = await ctx.newUser();
      final partner = await ctx.newUser();
      final other = await ctx.newUser();
      await ctx.newPartner(sharedById: me.id, sharedWithId: partner.id);

      final result = await sut.getCandidates(me.id).first;

      expect(result.map((user) => user.id), unorderedEquals([other.id]));
    });

    test('includes users who share with the current user but are not shared with back', () async {
      final me = await ctx.newUser();
      final inbound = await ctx.newUser();
      await ctx.newPartner(sharedById: inbound.id, sharedWithId: me.id);

      final result = await sut.getCandidates(me.id).first;

      expect(result.map((user) => user.id), unorderedEquals([inbound.id]));
    });

    test('emits an updated list when the current user adds a partner', () async {
      final me = await ctx.newUser();
      final a = await ctx.newUser();
      final b = await ctx.newUser();

      final ids = sut.getCandidates(me.id).map((users) => users.map((user) => user.id).toList());
      final expectation = expectLater(
        ids,
        emitsInOrder([
          unorderedEquals([a.id, b.id]),
          unorderedEquals([b.id]),
        ]),
      );

      await ctx.newPartner(sharedById: me.id, sharedWithId: a.id);
      await expectation;
    });
  });

  group('create', () {
    test('calls the API then persists the partnership locally', () async {
      final me = await ctx.newUser();
      final partner = await ctx.newUser();

      await sut.create(sharedById: me.id, sharedWithId: partner.id);

      verify(() => ctx.partnerApi.create(partner.id)).called(1);
      final shared = await sut.search(me.id, .sharedBy).first;
      expect(shared.map((p) => p.id), unorderedEquals([partner.id]));
    });
  });

  group('delete', () {
    test('calls the API then removes the partnership locally', () async {
      final me = await ctx.newUser();
      final recipient = await ctx.newUser();
      await ctx.newPartner(sharedById: me.id, sharedWithId: recipient.id);

      await sut.delete(sharedById: me.id, sharedWithId: recipient.id);

      verify(() => ctx.partnerApi.delete(recipient.id)).called(1);
      final shared = await sut.search(me.id, .sharedBy).first;
      expect(shared, isEmpty);
    });
  });

  group('update', () {
    test('calls the API then updates the inTimeline flag locally', () async {
      final me = await ctx.newUser();
      final sharer = await ctx.newUser();
      await ctx.newPartner(sharedById: sharer.id, sharedWithId: me.id, inTimeline: false);

      await sut.update(sharedById: sharer.id, sharedWithId: me.id, inTimeline: true);

      verify(() => ctx.partnerApi.update(sharer.id, inTimeline: true)).called(1);
      final partner = await ctx.partnerRepository.get(sharedById: sharer.id, sharedWithId: me.id);
      expect(partner.inTimeline, isTrue);
    });
  });
}
