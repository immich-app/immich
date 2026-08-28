// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/search.service.dart';
import 'package:openapi/api.dart';

part 'search_filter.provider.freezed.dart';

@freezed
class const SearchSuggestionArgs({
  required final SearchSuggestionType type,
  final String? locationCountry,
  final String? locationState,
  final String? make,
  final String? model,
}) with _$SearchSuggestionArgs;

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
