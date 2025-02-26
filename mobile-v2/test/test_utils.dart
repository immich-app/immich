import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/entities/asset_isar.entity.dart';
import 'package:isar/isar.dart';

abstract final class TestUtils {
  const TestUtils._();

  /// Downloads Isar binaries (if required) and initializes a new Isar db
  static Future<Isar> initIsar() async {
    await Isar.initializeIsarCore(download: true);

    final instance = Isar.getInstance();
    if (instance != null) {
      return instance;
    }

    final db = await Isar.open(
      [AssetSchema],
      directory: "test/",
      maxSizeMiB: 1024,
      inspector: false,
    );

    // Clear and close db on test end
    addTearDown(() async {
      if (!db.isOpen) {
        return;
      }
      await db.writeTxn(() async => await db.clear());
      await db.close();
    });
    return db;
  }
}
