import 'package:immich_mobile/services/search.service.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'search_filter.provider.g.dart';

@riverpod
Future<List<String>> getSearchSuggestions(
  GetSearchSuggestionsRef ref,
  SearchSuggestionType type, {
  String? locationCountry,
  String? locationState,
  String? make,
  String? model,
}) async {
  final SearchService service = ref.read(searchServiceProvider);

  final suggestions = await service.getSearchSuggestions(
    type,
    country: locationCountry,
    state: locationState,
    make: make,
    model: model,
  );

  return suggestions ?? [];
}
