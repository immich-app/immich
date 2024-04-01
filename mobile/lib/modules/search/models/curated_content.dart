// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

/// A wrapper for [CuratedLocationsResponseDto] objects
/// and [CuratedObjectsResponseDto] to be displayed in
/// a view
class CuratedContent {
  /// The label to show associated with this curated object
  final String label;

  /// The id to lookup the asset from the server
  final String id;

  CuratedContent({
    required this.label,
    required this.id,
  });

  CuratedContent copyWith({
    String? label,
    String? id,
  }) {
    return CuratedContent(
      label: label ?? this.label,
      id: id ?? this.id,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'label': label,
      'id': id,
    };
  }

  factory CuratedContent.fromMap(Map<String, dynamic> map) {
    return CuratedContent(
      label: map['label'] as String,
      id: map['id'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory CuratedContent.fromJson(String source) =>
      CuratedContent.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'CuratedContent(label: $label, id: $id)';

  @override
  bool operator ==(covariant CuratedContent other) {
    if (identical(this, other)) return true;

    return other.label == label && other.id == id;
  }

  @override
  int get hashCode => label.hashCode ^ id.hashCode;
}
