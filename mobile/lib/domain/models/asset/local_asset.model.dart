part of 'base_asset.model.dart';

class LocalAsset extends BaseAsset {
  final String id;
  final String? remoteAssetId;
  final String? cloudId;
  final int orientation;

  final DateTime? adjustmentTime;
  final double? latitude;
  final double? longitude;

  const LocalAsset({
    required this.id,
    String? remoteId,
    this.cloudId,
    required super.name,
    super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.width,
    super.height,
    super.durationInSeconds,
    super.isFavorite = false,
    super.livePhotoVideoId,
    this.orientation = 0,
    this.adjustmentTime,
    this.latitude,
    this.longitude,
  }) : remoteAssetId = remoteId;

  @override
  String? get localId => id;

  @override
  String? get remoteId => remoteAssetId;

  @override
  AssetState get storage => remoteId == null ? AssetState.local : AssetState.merged;

  @override
  String get heroTag => '${id}_${remoteId ?? checksum}';

  String get eTag {
    final createdAt = this.createdAt.millisecondsSinceEpoch ~/ 1000;
    final adjustmentTime = this.adjustmentTime?.millisecondsSinceEpoch ?? 0;
    final latitude = this.latitude?.truncateTo(2).toStringAsFixed(2) ?? "0.00";
    final longitude = this.longitude?.truncateTo(2).toStringAsFixed(2) ?? "0.00";
    return "$createdAt$kUploadETagDelimiter$adjustmentTime$kUploadETagDelimiter$latitude$kUploadETagDelimiter$longitude";
  }

  bool get hasCoordinates => latitude != null && longitude != null && latitude != 0 && longitude != 0;

  @override
  String toString() {
    return '''LocalAsset {
   id: $id,
   name: $name,
   type: $type,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   width: ${width ?? "<NA>"},
   height: ${height ?? "<NA>"},
   durationInSeconds: ${durationInSeconds ?? "<NA>"},
   remoteId: ${remoteId ?? "<NA>"}
   cloudId: ${cloudId ?? "<NA>"}
   checksum: ${checksum ?? "<NA>"},
   isFavorite: $isFavorite,
   orientation: $orientation,
   adjustmentTime: $adjustmentTime,
   latitude: ${latitude ?? "<NA>"},
   longitude: ${longitude ?? "<NA>"},
 }''';
  }

  // Not checking for remoteId here
  @override
  bool operator ==(Object other) {
    if (other is! LocalAsset) return false;
    if (identical(this, other)) return true;
    return super == other &&
        id == other.id &&
        cloudId == other.cloudId &&
        orientation == other.orientation &&
        adjustmentTime == other.adjustmentTime &&
        latitude == other.latitude &&
        longitude == other.longitude;
  }

  @override
  int get hashCode =>
      super.hashCode ^
      id.hashCode ^
      remoteId.hashCode ^
      orientation.hashCode ^
      adjustmentTime.hashCode ^
      latitude.hashCode ^
      longitude.hashCode;

  LocalAsset copyWith({
    String? id,
    String? remoteId,
    String? cloudId,
    String? name,
    String? checksum,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? width,
    int? height,
    int? durationInSeconds,
    bool? isFavorite,
    int? orientation,
    DateTime? adjustmentTime,
    double? latitude,
    double? longitude,
  }) {
    return LocalAsset(
      id: id ?? this.id,
      remoteId: remoteId ?? this.remoteId,
      cloudId: cloudId ?? this.cloudId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      isFavorite: isFavorite ?? this.isFavorite,
      orientation: orientation ?? this.orientation,
      adjustmentTime: adjustmentTime ?? this.adjustmentTime,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }
}
