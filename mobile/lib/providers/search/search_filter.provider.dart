import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/search.service.dart';
import 'package:openapi/api.dart';

class SearchSuggestionArgs {
  SearchSuggestionType type;
  final String? locationCountry;
  final String? locationState;
  final String? make;
  final String? model;

  SearchSuggestionArgs({required this.type, this.locationCountry, this.locationState, this.make, this.model});

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SearchSuggestionArgs &&
        other.type == type &&
        other.locationCountry == locationCountry &&
        other.locationState == locationState &&
        other.make == make &&
        other.model == model;
  }

  @override
  int get hashCode {
    return type.hashCode ^ locationCountry.hashCode ^ locationState.hashCode ^ make.hashCode ^ model.hashCode;
  }
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
