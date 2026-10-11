import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';

final currentPersonScopedProvider = Provider<Person?>((ref) => null);
