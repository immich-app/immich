import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

/// Returns city suggestions for a given country, or an empty list when
/// country is null/empty. Not debounced — a single user tap drives re-fetch.
final citySuggestionsProvider = FutureProvider.autoDispose.family<List<String>, String?>((ref, country) async {
  if (country == null || country.isEmpty) return const <String>[];
  final api = ref.watch(apiServiceProvider).searchApi;
  final response = await api.getSearchSuggestionsWithHttpInfo(
    SearchSuggestionType.city,
    country: country,
    withSharedSpaces: false,
  );

  if (response.body.isEmpty) {
    return const <String>[];
  }

  return List<String>.from(jsonDecode(utf8.decode(response.bodyBytes)) as List);
});
