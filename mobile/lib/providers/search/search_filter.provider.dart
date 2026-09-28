import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/search.service.dart';
import 'package:openapi/api.dart';

part 'search_filter.provider.freezed.dart';

@freezed
abstract class SearchSuggestionArgs with _$SearchSuggestionArgs {
  const factory SearchSuggestionArgs({
    required SearchSuggestionType type,
    String? locationCountry,
    String? locationState,
    String? make,
    String? model,
  }) = _SearchSuggestionArgs;
}

final getSearchSuggestionsProvider = FutureProvider.autoDispose.family<List<String>, SearchSuggestionArgs>((
  ref,
  args,
) async {
  final SearchService service = ref.read(searchServiceProvider);

  final suggestions = await service.getSearchSuggestions(
    args.type,
    country: args.locationCountry,
    state: args.locationState,
    make: args.make,
    model: args.model,
  );

  return suggestions ?? [];
});
