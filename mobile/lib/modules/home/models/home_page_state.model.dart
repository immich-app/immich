import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class HomePageState {
  final bool isMultiSelectEnable;
  final List<ImmichAsset> selectedItems;

  HomePageState({
    required this.isMultiSelectEnable,
    required this.selectedItems,
  });

  HomePageState copyWith({
    bool? isMultiSelectEnable,
    List<ImmichAsset>? selectedItems,
  }) {
    return HomePageState(
      isMultiSelectEnable: isMultiSelectEnable ?? this.isMultiSelectEnable,
      selectedItems: selectedItems ?? this.selectedItems,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'isMultiSelectEnable': isMultiSelectEnable,
      'selectedItems': selectedItems.map((x) => x.toMap()).toList(),
    };
  }

  factory HomePageState.fromMap(Map<String, dynamic> map) {
    return HomePageState(
      isMultiSelectEnable: map['isMultiSelectEnable'] ?? false,
      selectedItems: List<ImmichAsset>.from(map['selectedItems']?.map((x) => ImmichAsset.fromMap(x))),
    );
  }

  String toJson() => json.encode(toMap());

  factory HomePageState.fromJson(String source) => HomePageState.fromMap(json.decode(source));

  @override
  String toString() => 'HomePageState(isMultiSelectEnable: $isMultiSelectEnable, selectedItems: $selectedItems)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is HomePageState &&
        other.isMultiSelectEnable == isMultiSelectEnable &&
        listEquals(other.selectedItems, selectedItems);
  }

  @override
  int get hashCode => isMultiSelectEnable.hashCode ^ selectedItems.hashCode;
}
