import 'dart:convert';

class CheckDuplicateAssetResponse {
  final bool isExist;
  CheckDuplicateAssetResponse({
    required this.isExist,
  });

  CheckDuplicateAssetResponse copyWith({
    bool? isExist,
  }) {
    return CheckDuplicateAssetResponse(
      isExist: isExist ?? this.isExist,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'isExist': isExist});

    return result;
  }

  factory CheckDuplicateAssetResponse.fromMap(Map<String, dynamic> map) {
    return CheckDuplicateAssetResponse(
      isExist: map['isExist'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory CheckDuplicateAssetResponse.fromJson(String source) =>
      CheckDuplicateAssetResponse.fromMap(json.decode(source));

  @override
  String toString() => 'CheckDuplicateAssetResponse(isExist: $isExist)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CheckDuplicateAssetResponse && other.isExist == isExist;
  }

  @override
  int get hashCode => isExist.hashCode;
}
