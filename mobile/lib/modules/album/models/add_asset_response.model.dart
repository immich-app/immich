// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:collection/collection.dart';

class AddAssetsResponse {
  List<String> alreadyInAlbum;
  int successfullyAdded;

  AddAssetsResponse({
    required this.alreadyInAlbum,
    required this.successfullyAdded,
  });

  AddAssetsResponse copyWith({
    List<String>? alreadyInAlbum,
    int? successfullyAdded,
  }) {
    return AddAssetsResponse(
      alreadyInAlbum: alreadyInAlbum ?? this.alreadyInAlbum,
      successfullyAdded: successfullyAdded ?? this.successfullyAdded,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'alreadyInAlbum': alreadyInAlbum,
      'successfullyAdded': successfullyAdded,
    };
  }

  String toJson() => json.encode(toMap());

  @override
  String toString() =>
      'AddAssetsResponse(alreadyInAlbum: $alreadyInAlbum, successfullyAdded: $successfullyAdded)';

  @override
  bool operator ==(covariant AddAssetsResponse other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.alreadyInAlbum, alreadyInAlbum) &&
        other.successfullyAdded == successfullyAdded;
  }

  @override
  int get hashCode => alreadyInAlbum.hashCode ^ successfullyAdded.hashCode;
}
