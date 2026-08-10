import 'package:freezed_annotation/freezed_annotation.dart';

part 'search_curated_content.model.freezed.dart';

/// A wrapper for [CuratedLocationsResponseDto] objects
/// and [CuratedObjectsResponseDto] to be displayed in
/// a view
@freezed
abstract class SearchCuratedContent with _$SearchCuratedContent {
  const factory SearchCuratedContent({
    /// The label to show associated with this curated object
    required String label,

    /// The id to lookup the asset from the server
    required String id,

    /// The subtitle to show below the label
    String? subtitle,
  }) = _SearchCuratedContent;
}
