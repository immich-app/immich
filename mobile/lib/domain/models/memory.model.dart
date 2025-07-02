// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

enum MemoryTypeEnum {
  // do not change this order!
  onThisDay,
}

class MemoryData {
  final int year;

  const MemoryData({
    required this.year,
  });

  MemoryData copyWith({
    int? year,
  }) {
    return MemoryData(
      year: year ?? this.year,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'year': year,
    };
  }

  factory MemoryData.fromMap(Map<String, dynamic> map) {
    return MemoryData(
      year: map['year'] as int,
    );
  }

  String toJson() => json.encode(toMap());

  factory MemoryData.fromJson(String source) =>
      MemoryData.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'MemoryData(year: $year)';

  @override
  bool operator ==(covariant MemoryData other) {
    if (identical(this, other)) return true;

    return other.year == year;
  }

  @override
  int get hashCode => year.hashCode;
}

// Model for a memory stored in the server
class Memory {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final String ownerId;

  // enum
  final MemoryTypeEnum type;
  final MemoryData data;
  final bool isSaved;
  final DateTime memoryAt;
  final DateTime? seenAt;
  final DateTime? showAt;
  final DateTime? hideAt;

  const Memory({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    required this.ownerId,
    required this.type,
    required this.data,
    required this.isSaved,
    required this.memoryAt,
    this.seenAt,
    this.showAt,
    this.hideAt,
  });

  Memory copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
    String? ownerId,
    MemoryTypeEnum? type,
    MemoryData? data,
    bool? isSaved,
    DateTime? memoryAt,
    DateTime? seenAt,
    DateTime? showAt,
    DateTime? hideAt,
  }) {
    return Memory(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      ownerId: ownerId ?? this.ownerId,
      type: type ?? this.type,
      data: data ?? this.data,
      isSaved: isSaved ?? this.isSaved,
      memoryAt: memoryAt ?? this.memoryAt,
      seenAt: seenAt ?? this.seenAt,
      showAt: showAt ?? this.showAt,
      hideAt: hideAt ?? this.hideAt,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
      'deletedAt': deletedAt?.millisecondsSinceEpoch,
      'ownerId': ownerId,
      'type': type.index,
      'data': data.toMap(),
      'isSaved': isSaved,
      'memoryAt': memoryAt.millisecondsSinceEpoch,
      'seenAt': seenAt?.millisecondsSinceEpoch,
      'showAt': showAt?.millisecondsSinceEpoch,
      'hideAt': hideAt?.millisecondsSinceEpoch,
    };
  }

  factory Memory.fromMap(Map<String, dynamic> map) {
    return Memory(
      id: map['id'] as String,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] as int),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updatedAt'] as int),
      deletedAt: map['deletedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['deletedAt'] as int)
          : null,
      ownerId: map['ownerId'] as String,
      type: MemoryTypeEnum.values[map['type'] as int],
      data: MemoryData.fromMap(map['data'] as Map<String, dynamic>),
      isSaved: map['isSaved'] as bool,
      memoryAt: DateTime.fromMillisecondsSinceEpoch(map['memoryAt'] as int),
      seenAt: map['seenAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['seenAt'] as int)
          : null,
      showAt: map['showAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['showAt'] as int)
          : null,
      hideAt: map['hideAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['hideAt'] as int)
          : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory Memory.fromJson(String source) =>
      Memory.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'Memory(id: $id, createdAt: $createdAt, updatedAt: $updatedAt, deletedAt: $deletedAt, ownerId: $ownerId, type: $type, data: $data, isSaved: $isSaved, memoryAt: $memoryAt, seenAt: $seenAt, showAt: $showAt, hideAt: $hideAt)';
  }

  @override
  bool operator ==(covariant Memory other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.deletedAt == deletedAt &&
        other.ownerId == ownerId &&
        other.type == type &&
        other.data == data &&
        other.isSaved == isSaved &&
        other.memoryAt == memoryAt &&
        other.seenAt == seenAt &&
        other.showAt == showAt &&
        other.hideAt == hideAt;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        deletedAt.hashCode ^
        ownerId.hashCode ^
        type.hashCode ^
        data.hashCode ^
        isSaved.hashCode ^
        memoryAt.hashCode ^
        seenAt.hashCode ^
        showAt.hashCode ^
        hideAt.hashCode;
  }
}
