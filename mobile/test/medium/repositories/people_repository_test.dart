// drift also exports isNotNull, which collides with the matcher of the same name
import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/entities/person_user.entity.drift.dart';
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

  group('updatedAt', () {
    test('follows person_user when the thumbnail changed more recently', () async {
      final user = await ctx.newUser();
      final person = await ctx.newPerson(ownerId: user.id);
      final thumbnailChangedAt = DateTime.now().add(const Duration(days: 1));

      await (ctx.db.update(ctx.db.personUserEntity)..where((row) => row.personId.equals(person.id))).write(
        PersonUserEntityCompanion(updatedAt: Value(thumbnailChangedAt)),
      );

      final result = await sut.get(person.id);

      expect(result, isNotNull);
      expect(result!.updatedAt, thumbnailChangedAt);
    });
  });

  group('person user', () {
    test('reads the user flags from person_user', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final person = await ctx.newPerson(ownerId: user.id, isFavorite: true);
      await ctx.newFace(assetId: asset.id, personId: person.id);

      final result = await sut.get(person.id);

      expect(result, isNotNull);
      expect(result!.isFavorite, isTrue);
      expect(result.isHidden, isFalse);
    });
  });
}
