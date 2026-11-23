import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late MemoryService sut;
  late String ownerId;
  late DateTime today;

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = MemoryService(MemoryRepository(ctx.db));
    ownerId = (await ctx.newUser()).id;
    final now = DateTime.now();
    today = DateTime.utc(now.year, now.month, now.day);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  Future<String> newOnThisDay(int year) async {
    final memory = await ctx.newMemory(
      ownerId: ownerId,
      year: year,
      memoryAt: DateTime.utc(year, today.month, today.day),
      showAt: today,
      hideAt: today.add(const Duration(days: 1)),
    );
    final asset = await ctx.newRemoteAsset(ownerId: ownerId);
    await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);
    return memory.id;
  }

  Future<String> newBirthday(String personName, {required int daysUntilBirthday}) async {
    final birthday = today.add(Duration(days: daysUntilBirthday));
    final memory = await ctx.newMemory(
      ownerId: ownerId,
      type: MemoryTypeEnum.birthday,
      personName: personName,
      memoryAt: birthday,
      showAt: birthday.subtract(const Duration(days: 3)),
      hideAt: birthday.add(const Duration(days: 1)),
    );
    final asset = await ctx.newRemoteAsset(ownerId: ownerId);
    await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);
    return memory.id;
  }

  group('getMemoryLane', () {
    test('shows birthday memories before on this day memories', () async {
      final onThisDay2020 = await newOnThisDay(2020);
      final onThisDay2022 = await newOnThisDay(2022);
      final aliceBirthday = await newBirthday('Alice', daysUntilBirthday: 2);
      final bobBirthday = await newBirthday('Bob', daysUntilBirthday: 1);

      final result = await sut.getMemoryLane(ownerId);

      expect(result.map((memory) => memory.id), [aliceBirthday, bobBirthday, onThisDay2022, onThisDay2020]);
    });
  });

  group('getAll', () {
    test('keeps birthday memories in date order', () async {
      final onThisDay = await newOnThisDay(2022);
      final birthday = await newBirthday('Alice', daysUntilBirthday: 2);

      final result = await sut.getAll(ownerId);

      expect(result.map((memory) => memory.id), [onThisDay, birthday]);
    });
  });
}
