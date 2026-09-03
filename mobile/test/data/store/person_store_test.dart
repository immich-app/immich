import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/person.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../medium/repository_context.dart';

class _MockPersonApi extends Mock implements PersonApiRepository {}

void main() {
  late MediumRepositoryContext ctx;
  late _MockPersonApi api;
  late ProviderContainer container;

  setUp(() {
    ctx = MediumRepositoryContext();
    api = _MockPersonApi();
    container = ProviderContainer(
      overrides: [
        driftProvider.overrideWithValue(ctx.db),
        personApiRepositoryProvider.overrideWithValue(api),
        // No stored preferences: the default minimum face count applies
        userMetadataPreferencesProvider.overrideWith((ref) => Future.value(null)),
      ],
    );
    addTearDown(container.dispose);
    addTearDown(ctx.dispose);
  });

  Future<Person?> byId(String personId) => container.read(Store.people.byId(personId).future);

  test('forAsset serves the people on the asset', () async {
    final user = await ctx.newUser();
    final asset = await ctx.newRemoteAsset(ownerId: user.id);
    final person = await ctx.newPerson(ownerId: user.id);
    await ctx.newFace(assetId: asset.id, personId: person.id);

    final people = await container.read(Store.people.forAsset(asset.id).future);

    expect(people.map((p) => p.id), [person.id]);
  });

  test('all serves named people, hiding unnamed ones lacking the face count', () async {
    final user = await ctx.newUser();
    final asset = await ctx.newRemoteAsset(ownerId: user.id);
    final named = await ctx.newPerson(ownerId: user.id, name: 'Alice');
    final unnamed = await ctx.newPerson(ownerId: user.id, name: '');

    await ctx.newFace(assetId: asset.id, personId: named.id);
    await ctx.newFace(assetId: asset.id, personId: unnamed.id);

    final people = await container.read(Store.people.all().future);

    expect(people.map((p) => p.id), [named.id]);
  });

  test('updateName pushes to the server, then saves locally', () async {
    final user = await ctx.newUser();
    final person = await ctx.newPerson(ownerId: user.id, name: 'Old');

    when(() => api.update(person.id, name: 'New')).thenAnswer((_) async => Person(id: person.id, name: 'New'));

    await container.read(Store.people).updateName(person.id, 'New');

    verify(() => api.update(person.id, name: 'New')).called(1);
    expect((await byId(person.id))?.name, 'New');
  });

  test('updateName leaves the DB untouched when the server rejects', () async {
    final user = await ctx.newUser();
    final person = await ctx.newPerson(ownerId: user.id, name: 'Old');
    when(() => api.update(person.id, name: 'New')).thenThrow(Exception('rejected'));

    await expectLater(container.read(Store.people).updateName(person.id, 'New'), throwsException);

    expect((await byId(person.id))?.name, 'Old');
  });

  test('updateBirthday pushes to the server, then saves locally', () async {
    final user = await ctx.newUser();
    final person = await ctx.newPerson(ownerId: user.id);
    final birthday = DateTime.utc(1990, 4, 2);

    when(
      () => api.update(person.id, birthday: birthday),
    ).thenAnswer((_) async => Person(id: person.id, name: person.name, birthDate: birthday));

    await container.read(Store.people).updateBirthday(person.id, birthday);

    verify(() => api.update(person.id, birthday: birthday)).called(1);
    expect((await byId(person.id))?.birthDate, birthday);
  });
}
