import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'db.provider.g.dart';

@Riverpod(keepAlive: true)
Isar isar(Ref ref) => throw UnimplementedError('isar');
