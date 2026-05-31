// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PurchaseUpdate {
  const PurchaseUpdate({this.hideBuyButtonUntil, this.showSupportBadge});

  /// Date until which to hide buy button
  final String? hideBuyButtonUntil;

  /// Whether to show support badge
  final bool? showSupportBadge;

  static const _undefined = Object();

  static PurchaseUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<PurchaseUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      hideBuyButtonUntil: (json[r'hideBuyButtonUntil'] as String?),
      showSupportBadge: (json[r'showSupportBadge'] as bool?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (hideBuyButtonUntil != null) {
      json[r'hideBuyButtonUntil'] = hideBuyButtonUntil!;
    }
    if (showSupportBadge != null) {
      json[r'showSupportBadge'] = showSupportBadge!;
    }
    return json;
  }

  PurchaseUpdate copyWith({Object? hideBuyButtonUntil = _undefined, Object? showSupportBadge = _undefined}) {
    return .new(
      hideBuyButtonUntil: identical(hideBuyButtonUntil, _undefined)
          ? this.hideBuyButtonUntil
          : hideBuyButtonUntil as String?,
      showSupportBadge: identical(showSupportBadge, _undefined) ? this.showSupportBadge : showSupportBadge as bool?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PurchaseUpdate &&
            hideBuyButtonUntil == other.hideBuyButtonUntil &&
            showSupportBadge == other.showSupportBadge);
  }

  @override
  int get hashCode {
    return Object.hashAll([hideBuyButtonUntil, showSupportBadge]);
  }

  @override
  String toString() => 'PurchaseUpdate(hideBuyButtonUntil=$hideBuyButtonUntil, showSupportBadge=$showSupportBadge)';
}
