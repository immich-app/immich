import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/database.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/database.repository.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'database.provider.g.dart';

@Riverpod(keepAlive: true)
Isar isar(Ref ref) => throw UnimplementedError('isar');

@riverpod
IDatabaseRepository databaseRepo(Ref ref) =>
    IsarDatabaseRepository(ref.watch(isarProvider));
