import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';

// overwritten in main.dart due to async loading
final dbProvider = Provider<Isar>((_) => throw UnimplementedError());
