// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PurchaseResponse {
  const PurchaseResponse({required this.hideBuyButtonUntil, required this.showSupportBadge});

  /// Date until which to hide buy button
  final String hideBuyButtonUntil;

  /// Whether to show support badge
  final bool showSupportBadge;

  static PurchaseResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<PurchaseResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      hideBuyButtonUntil: json[r'hideBuyButtonUntil'] as String,
      showSupportBadge: json[r'showSupportBadge'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'hideBuyButtonUntil'] = hideBuyButtonUntil;
    json[r'showSupportBadge'] = showSupportBadge;
    return json;
  }

  PurchaseResponse copyWith({String? hideBuyButtonUntil, bool? showSupportBadge}) {
    return .new(
      hideBuyButtonUntil: hideBuyButtonUntil ?? this.hideBuyButtonUntil,
      showSupportBadge: showSupportBadge ?? this.showSupportBadge,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PurchaseResponse &&
            hideBuyButtonUntil == other.hideBuyButtonUntil &&
            showSupportBadge == other.showSupportBadge);
  }

  @override
  int get hashCode {
    return Object.hashAll([hideBuyButtonUntil, showSupportBadge]);
  }

  @override
  String toString() => 'PurchaseResponse(hideBuyButtonUntil=$hideBuyButtonUntil, showSupportBadge=$showSupportBadge)';
}
