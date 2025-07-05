import 'dart:convert';

// Model for a stack stored in the server
class Stack {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String primaryAssetId;

  const Stack({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.ownerId,
    required this.primaryAssetId,
  });

  Stack copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? ownerId,
    String? primaryAssetId,
  }) {
    return Stack(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
      'ownerId': ownerId,
      'primaryAssetId': primaryAssetId,
    };
  }

  factory Stack.fromMap(Map<String, dynamic> map) {
    return Stack(
      id: map['id'] as String,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] as int),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updatedAt'] as int),
      ownerId: map['ownerId'] as String,
      primaryAssetId: map['primaryAssetId'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory Stack.fromJson(String source) =>
      Stack.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'Stack(id: $id, createdAt: $createdAt, updatedAt: $updatedAt, ownerId: $ownerId, primaryAssetId: $primaryAssetId)';
  }

  @override
  bool operator ==(covariant Stack other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.ownerId == ownerId &&
        other.primaryAssetId == primaryAssetId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        ownerId.hashCode ^
        primaryAssetId.hashCode;
  }
}
