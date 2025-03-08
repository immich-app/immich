// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

/// A wrapper for [CuratedLocationsResponseDto] objects
/// and [CuratedObjectsResponseDto] to be displayed in
/// a view
class SearchCuratedContent {
  /// The label to show associated with this curated object
  final String label;

  /// The subtitle to show below the label
  final String? subtitle;

  /// The id to lookup the asset from the server
  final String id;

  SearchCuratedContent({
    required this.label,
    required this.id,
    this.subtitle,
  });

  SearchCuratedContent copyWith({
    String? label,
    String? subtitle,
    String? id,
  }) {
    return SearchCuratedContent(
      label: label ?? this.label,
      subtitle: subtitle ?? this.subtitle,
      id: id ?? this.id,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'label': label,
      'subtitle': subtitle,
      'id': id,
    };
  }

  factory SearchCuratedContent.fromMap(Map<String, dynamic> map) {
    return SearchCuratedContent(
      label: map['label'] as String,
      subtitle: map['subtitle'] as String?,
      id: map['id'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchCuratedContent.fromJson(String source) =>
      SearchCuratedContent.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'CuratedContent(label: $label, subtitle: $subtitle, id: $id)';

  @override
  bool operator ==(covariant SearchCuratedContent other) {
    if (identical(this, other)) return true;

    return other.label == label && other.subtitle == subtitle && other.id == id;
  }

  @override
  int get hashCode => label.hashCode ^ id.hashCode;
}
