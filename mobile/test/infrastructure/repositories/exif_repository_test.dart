import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/exif.repository.dart';
import 'package:isar/isar.dart';

import '../../fixtures/exif.stub.dart';
import '../../test_utils.dart';

Future<void> _populateExifTable(Isar db) async {
  await db.writeTxn(() async {
    await db.exifInfos.putAll([
      ExifInfo.fromDto(ExifStub.size),
      ExifInfo.fromDto(ExifStub.gps),
      ExifInfo.fromDto(ExifStub.rotated90CW),
      ExifInfo.fromDto(ExifStub.rotated270CW),
    ]);
  });
}

void main() {
  late Isar db;
  late IExifInfoRepository sut;

  setUp(() async {
    db = await TestUtils.initIsar();
    sut = IsarExifRepository(db);
  });

  group("Return with proper orientation", () {
    setUp(() async {
      await _populateExifTable(db);
    });

    test("isFlipped true for 90CW", () async {
      final exif = await sut.get(ExifStub.rotated90CW.assetId!);
      expect(exif!.isFlipped, true);
    });

    test("isFlipped true for 270CW", () async {
      final exif = await sut.get(ExifStub.rotated270CW.assetId!);
      expect(exif!.isFlipped, true);
    });

    test("isFlipped false for the original non-rotated image", () async {
      final exif = await sut.get(ExifStub.size.assetId!);
      expect(exif!.isFlipped, false);
    });
  });
}
