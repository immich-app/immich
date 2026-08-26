// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'search_curated_content.model.freezed.dart';

/// A wrapper for [CuratedLocationsResponseDto] objects
/// and [CuratedObjectsResponseDto] to be displayed in
/// a view
@freezed
class const SearchCuratedContent({
  /// The label to show associated with this curated object
  required final String label,

  /// The id to lookup the asset from the server
  required final String id,

  /// The subtitle to show below the label
  final String? subtitle,
}) with _$SearchCuratedContent;
