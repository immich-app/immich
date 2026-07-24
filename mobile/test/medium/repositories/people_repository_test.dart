import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/people.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftPeopleRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftPeopleRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getAssetPeople', () {
    test('does not duplicate a person with multiple face records on the same asset', () async {
      // Regression check for #20585: a join on asset_face_entity returned one row
      // per face, so a person appeared twice in the asset details panel when the
      // same face was on the asset more than once (e.g., metadata import + ML)
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      final person = await ctx.newPerson(ownerId: user.id);
      await ctx.newFace(assetId: asset.id, personId: person.id);
      await ctx.newFace(assetId: asset.id, personId: person.id);

      final people = await sut.getAssetPeople(asset.id);

      expect(people, hasLength(1));
      expect(people.single.id, person.id);
    });

    test('returns all distinct people of an asset', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      final person1 = await ctx.newPerson(ownerId: user.id);
      final person2 = await ctx.newPerson(ownerId: user.id);
      await ctx.newFace(assetId: asset.id, personId: person1.id);
      await ctx.newFace(assetId: asset.id, personId: person2.id);

      final people = await sut.getAssetPeople(asset.id);

      expect(people, hasLength(2));
      expect(people.map((person) => person.id), containsAll([person1.id, person2.id]));
    });

    test('does not return hidden people', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      final hidden = await ctx.newPerson(ownerId: user.id, isHidden: true);
      await ctx.newFace(assetId: asset.id, personId: hidden.id);

      final people = await sut.getAssetPeople(asset.id);

      expect(people, isEmpty);
    });

    test('does not return people from other assets', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final otherAsset = await ctx.newRemoteAsset(ownerId: user.id);

      final person = await ctx.newPerson(ownerId: user.id);
      await ctx.newFace(assetId: otherAsset.id, personId: person.id);

      final people = await sut.getAssetPeople(asset.id);

      expect(people, isEmpty);
    });
  });

  group('getAllPeople', () {
    test('counts distinct assets, not face records, against minFaces', () async {
      // Regression check: a person can have multiple face records on the same asset
      // (e.g., metadata import + ML detection), which must not inflate the count used
      // to compare against minFaces. An unnamed person with 2 distinct photos but 3
      // face records (2 of them on the same photo) must not pass a minFaces of 3.
      final user = await ctx.newUser();
      final asset1 = await ctx.newRemoteAsset(ownerId: user.id);
      final asset2 = await ctx.newRemoteAsset(ownerId: user.id);

      final person = await ctx.newPerson(ownerId: user.id, name: '');
      await ctx.newFace(assetId: asset1.id, personId: person.id);
      await ctx.newFace(assetId: asset1.id, personId: person.id);
      await ctx.newFace(assetId: asset2.id, personId: person.id);

      final people = await sut.getAllPeople(minFaces: 3);

      expect(people, isEmpty);
    });

    test('returns unnamed people who meet minFaces based on distinct assets', () async {
      final user = await ctx.newUser();
      final asset1 = await ctx.newRemoteAsset(ownerId: user.id);
      final asset2 = await ctx.newRemoteAsset(ownerId: user.id);
      final asset3 = await ctx.newRemoteAsset(ownerId: user.id);

      final person = await ctx.newPerson(ownerId: user.id, name: '');
      await ctx.newFace(assetId: asset1.id, personId: person.id);
      await ctx.newFace(assetId: asset2.id, personId: person.id);
      await ctx.newFace(assetId: asset3.id, personId: person.id);

      final people = await sut.getAllPeople(minFaces: 3);

      expect(people.map((p) => p.id), [person.id]);
    });

    test('always returns named people regardless of minFaces', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      final person = await ctx.newPerson(ownerId: user.id, name: 'Jane');
      await ctx.newFace(assetId: asset.id, personId: person.id);

      final people = await sut.getAllPeople(minFaces: 3);

      expect(people.map((p) => p.id), [person.id]);
    });
  });
}
