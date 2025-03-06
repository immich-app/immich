import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/paginated_search.provider.dart';

final searchFiltersProvider =
    StateNotifierProvider<SearchFilterNotifier, SearchFilter>((ref) {
  return SearchFilterNotifier(ref);
});

const searchFiltersDefault = SearchFilter(
  people: {},
  location: SearchLocationFilter(),
  camera: SearchCameraFilter(),
  date: SearchDateFilter(),
  display: SearchDisplayFilters(
    isNotInAlbum: false,
    isArchive: false,
    isFavorite: false,
  ),
  mediaType: AssetType.other,
);

class SearchFilterNotifier extends StateNotifier<SearchFilter> {
  final Ref ref;

  SearchFilterNotifier(this.ref) : super(searchFiltersDefault);

  SearchFilter get value => state;

  set value(SearchFilter value) {
    state = value;
  }

  void reset() {
    state = searchFiltersDefault;
  }

  Set<Person> get people => state.people;

  SearchLocationFilter get location => state.location;

  SearchCameraFilter get camera => state.camera;

  SearchDateFilter get date => state.date;

  SearchDisplayFilters get display => state.display;

  AssetType get mediaType => state.mediaType;

  set people(Set<Person> value) {
    state = state.copyWith(people: value);
  }

  set location(SearchLocationFilter value) {
    state = state.copyWith(location: value);
  }

  set camera(SearchCameraFilter value) {
    state = state.copyWith(camera: value);
  }

  set date(SearchDateFilter value) {
    state = state.copyWith(date: value);
  }

  set display(SearchDisplayFilters value) {
    state = state.copyWith(display: value);
  }

  set mediaType(AssetType value) {
    state = state.copyWith(mediaType: value);
  }

  Future<void> search() {
    ref.read(paginatedSearchProvider.notifier).clear();
    return ref.read(paginatedSearchProvider.notifier).search(state);
  }
}
