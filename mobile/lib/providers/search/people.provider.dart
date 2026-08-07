import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_data/model/person.dart';
import 'package:immich_data/store/store.dart';
import 'package:logging/logging.dart';

final getAllPeopleProvider = FutureProvider.autoDispose<List<PersonDto>>((ref) async {
  try {
    return await ref.read(Store.people).getAllPeopleFromServer();
  } catch (error, stack) {
    Logger("getAllPeopleProvider").severe("Error while fetching curated people", error, stack);
    return [];
  }
});
