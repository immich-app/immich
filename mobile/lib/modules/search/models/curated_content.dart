/// A wrapper for [CuratedLocationsResponseDto] objects
/// and [CuratedObjectsResponseDto] to be displayed in 
/// a view
class CuratedContent {
  /// The label to show associated with this curated object
  final String label;

  /// The id to lookup the asset from the server
  final String id;

  CuratedContent({
    required this.id,
    required this.label,
  });
}
