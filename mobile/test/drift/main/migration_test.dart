// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/entities/person_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import '../../unit/factories/person_factory.dart';
import '../../unit/factories/user_factory.dart';
import 'generated/schema.dart';
import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;
import 'generated/schema_v31.dart' as v31;

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  late SchemaVerifier verifier;

  setUpAll(() {
    verifier = SchemaVerifier(GeneratedHelper());
  });

  group('simple database migrations', () {
    // These simple tests verify all possible schema updates with a simple (no
    // data) migration. This is a quick way to ensure that written database
    // migrations properly alter the schema.
    const versions = GeneratedHelper.versions;
    for (final (i, fromVersion) in versions.indexed) {
      group('from $fromVersion', () {
        for (final toVersion in versions.skip(i + 1)) {
          test('to $toVersion', () async {
            final schema = await verifier.schemaAt(fromVersion);
            final db = Drift(schema.newConnection());
            await verifier.migrateAndValidate(db, toVersion);
            await db.close();
          });
        }
      });
    }
  });

  group('data migrations', () {
    test(
      'v31 to v32 rebuilds person_user from the dropped person columns',
      () async {
        final schema = await verifier.schemaAt(31);
        final oldDb = v31.DatabaseAtV31(schema.newConnection());
        final user = UserFactory.create();
        final person = PersonFactory.create();

        await oldDb
            .into(oldDb.userEntity)
            .insert(
              v31.UserEntityCompanion.insert(
                id: user.id,
                name: user.name,
                email: user.email,
                profileChangedAt: Value(
                  user.profileChangedAt.toIso8601String(),
                ),
              ),
            );
        await oldDb
            .into(oldDb.personEntity)
            .insert(
              v31.PersonEntityCompanion.insert(
                id: person.id,
                ownerId: user.id,
                name: person.name,
                isFavorite: person.isFavorite ? 1 : 0,
                isHidden: person.isHidden ? 1 : 0,
                createdAt: Value(person.createdAt.toIso8601String()),
                updatedAt: Value(person.updatedAt.toIso8601String()),
              ),
            );
        await oldDb.close();

        final db = Drift(schema.newConnection());
        await verifier.migrateAndValidate(db, 32);

        final personUsers = await db.select(db.personUserEntity).get();
        expect(personUsers, hasLength(1));
        expect(
          personUsers.single,
          isA<PersonUserEntityData>()
              .having((row) => row.personId, 'personId', person.id)
              .having((row) => row.ownerId, 'ownerId', user.id)
              .having((row) => row.isFavorite, 'isFavorite', person.isFavorite)
              .having((row) => row.isHidden, 'isHidden', person.isHidden),
        );

        final people = await db.select(db.personEntity).get();
        expect(people.single.name, person.name);

        await db.close();
      },
    );
  });
}
