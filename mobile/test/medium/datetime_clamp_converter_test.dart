import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';

import 'repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;

  setUp(() {
    ctx = MediumRepositoryContext();
  });

  tearDown(() async {
    await ctx.dispose();
  });

  final farFuture = DateTime.utc(144769, 11, 18, 12, 38, 32); // the reporter's year from #28524
  final bce = DateTime.utc(-4712, 3, 4, 5, 6, 7);
  const ceiling = '9999-12-31T00:00:00.000Z';
  const floor = '0001-01-01T00:00:00.000Z';

  test('clamps poison on every datetime column of every table (auto-covers future columns)', () async {
    // one row builder + pk values per table with datetime columns, in
    // allTables order (foreign keys resolve in this order). a date table
    // missing here fails the walk, and a date column left unpoisoned fails
    // the read-back, so schema growth forces this test to be extended
    final builders =
        <String, (Insertable<dynamic> Function(String suffix, DateTime d), List<String> Function(String suffix))>{
          'auth_user_entity': (
            (s, d) => AuthUserEntityCompanion(
              id: .new('au1$s'),
              name: const .new('n'),
              email: const .new('e'),
              avatarColor: const .new(AvatarColor.primary),
              profileChangedAt: .new(d),
            ),
            (s) => ['au1$s'],
          ),
          'user_entity': (
            (s, d) => UserEntityCompanion(
              id: .new('u1$s'),
              name: const .new('n'),
              email: const .new('e'),
              profileChangedAt: .new(d),
            ),
            (s) => ['u1$s'],
          ),
          'local_album_entity': (
            (s, d) => LocalAlbumEntityCompanion(
              id: .new('la1$s'),
              name: const .new('n'),
              updatedAt: .new(d),
              backupSelection: const .new(BackupSelection.selected),
            ),
            (s) => ['la1$s'],
          ),
          'local_asset_entity': (
            (s, d) => LocalAssetEntityCompanion(
              id: .new('l1$s'),
              name: const .new('n'),
              type: const .new(AssetType.image),
              createdAt: .new(d),
              updatedAt: .new(d),
              adjustmentTime: .new(d),
            ),
            (s) => ['l1$s'],
          ),
          'remote_asset_entity': (
            (s, d) => RemoteAssetEntityCompanion(
              id: .new('a1$s'),
              name: const .new('n'),
              type: const .new(AssetType.image),
              checksum: .new('c$s'),
              ownerId: .new('u1$s'),
              visibility: const .new(AssetVisibility.timeline),
              createdAt: .new(d),
              updatedAt: .new(d),
              localDateTime: .new(d),
              deletedAt: .new(d),
              uploadedAt: .new(d),
            ),
            (s) => ['a1$s'],
          ),
          'remote_exif_entity': (
            (s, d) => RemoteExifEntityCompanion(assetId: .new('a1$s'), dateTimeOriginal: .new(d)),
            (s) => ['a1$s'],
          ),
          'remote_album_entity': (
            (s, d) => RemoteAlbumEntityCompanion(
              id: .new('ra1$s'),
              name: const .new('n'),
              order: const .new(AlbumAssetOrder.asc),
              createdAt: .new(d),
              updatedAt: .new(d),
            ),
            (s) => ['ra1$s'],
          ),
          'remote_asset_cloud_id_entity': (
            (s, d) =>
                RemoteAssetCloudIdEntityCompanion(assetId: .new('a1$s'), createdAt: .new(d), adjustmentTime: .new(d)),
            (s) => ['a1$s'],
          ),
          'memory_entity': (
            (s, d) => MemoryEntityCompanion(
              id: .new('m1$s'),
              ownerId: .new('u1$s'),
              type: const .new(MemoryTypeEnum.onThisDay),
              data: const .new('{}'),
              createdAt: .new(d),
              updatedAt: .new(d),
              deletedAt: .new(d),
              memoryAt: .new(d),
              seenAt: .new(d),
              showAt: .new(d),
              hideAt: .new(d),
            ),
            (s) => ['m1$s'],
          ),
          'stack_entity': (
            (s, d) => StackEntityCompanion(
              id: .new('s1$s'),
              ownerId: .new('u1$s'),
              primaryAssetId: .new('a1$s'),
              createdAt: .new(d),
              updatedAt: .new(d),
            ),
            (s) => ['s1$s'],
          ),
          'person_entity': (
            (s, d) => PersonEntityCompanion(
              id: .new('p1$s'),
              ownerId: .new('u1$s'),
              name: const .new('n'),
              isFavorite: const .new(false),
              isHidden: const .new(false),
              createdAt: .new(d),
              updatedAt: .new(d),
              birthDate: .new(d),
            ),
            (s) => ['p1$s'],
          ),
          'asset_face_entity': (
            (s, d) => AssetFaceEntityCompanion(
              id: .new('f1$s'),
              assetId: .new('a1$s'),
              imageWidth: const .new(1),
              imageHeight: const .new(1),
              boundingBoxX1: const .new(0),
              boundingBoxY1: const .new(0),
              boundingBoxX2: const .new(1),
              boundingBoxY2: const .new(1),
              sourceType: const .new('machine-learning'),
              deletedAt: .new(d),
            ),
            (s) => ['f1$s'],
          ),
          'trashed_local_asset_entity': (
            (s, d) => TrashedLocalAssetEntityCompanion(
              id: .new('t1$s'),
              albumId: .new('al1$s'),
              name: const .new('n'),
              type: const .new(AssetType.image),
              source: const .new(TrashOrigin.localSync),
              createdAt: .new(d),
              updatedAt: .new(d),
            ),
            (s) => ['t1$s', 'al1$s'],
          ),
          'settings': ((s, d) => SettingsEntityCompanion(key: .new('k1$s'), updatedAt: .new(d)), (s) => ['k1$s']),
        };

    String pkWhere(String table) => switch (table) {
      'settings' => '"key" = ?',
      'remote_exif_entity' || 'remote_asset_cloud_id_entity' => '"asset_id" = ?',
      'trashed_local_asset_entity' => '"id" = ? AND "album_id" = ?',
      _ => '"id" = ?',
    };

    var walked = 0;
    for (final table in ctx.db.allTables) {
      final dateColumns = [
        for (final column in table.$columns)
          if (column.type == DriftSqlType.dateTime) column.$name,
      ];
      if (dateColumns.isEmpty) {
        continue;
      }
      walked++;

      final builder = builders[table.entityName];
      expect(builder, isNotNull, reason: 'no poison row defined for ${table.entityName}');

      for (final (poison, expected, suffix) in [(farFuture, ceiling, '_f'), (bce, floor, '_b')]) {
        await ctx.db.into(table).insert(builder!.$1(suffix, poison));

        final pkVars = [for (final value in builder.$2(suffix)) Variable(value)];
        for (final column in dateColumns) {
          final row = await ctx.db
              .customSelect(
                'SELECT "$column" AS v FROM "${table.entityName}" WHERE ${pkWhere(table.entityName)}',
                variables: pkVars,
              )
              .getSingle();
          expect(row.read<String>('v'), expected, reason: '${table.entityName}.$column');
        }
      }
    }

    expect(walked, 14, reason: 'every table with datetime columns must be walked');
  });

  test('a late hour on the last day of 9999 is stored at the midnight ceiling', () async {
    final user = await ctx.newUser();
    final asset = await ctx.newRemoteAsset(ownerId: user.id, createdAt: DateTime.utc(9999, 12, 31, 23, 59, 59));

    final row = await ctx.db
        .customSelect('SELECT created_at AS v FROM remote_asset_entity WHERE id = ?', variables: [Variable(asset.id)])
        .getSingle();

    expect(row.read<String>('v'), ceiling);
  });
}
