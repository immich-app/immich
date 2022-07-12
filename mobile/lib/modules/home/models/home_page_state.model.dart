import 'package:collection/collection.dart';

import 'package:openapi/api.dart';

class HomePageState {
  final bool isMultiSelectEnable;
  final Set<AssetResponseDto> selectedItems;
  final Set<String> selectedDateGroup;
  HomePageState({
    required this.isMultiSelectEnable,
    required this.selectedItems,
    required this.selectedDateGroup,
  });

  HomePageState copyWith({
    bool? isMultiSelectEnable,
    Set<AssetResponseDto>? selectedItems,
    Set<String>? selectedDateGroup,
  }) {
    return HomePageState(
      isMultiSelectEnable: isMultiSelectEnable ?? this.isMultiSelectEnable,
      selectedItems: selectedItems ?? this.selectedItems,
      selectedDateGroup: selectedDateGroup ?? this.selectedDateGroup,
    );
  }

  @override
  String toString() =>
      'HomePageState(isMultiSelectEnable: $isMultiSelectEnable, selectedItems: $selectedItems, selectedDateGroup: $selectedDateGroup)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is HomePageState &&
        other.isMultiSelectEnable == isMultiSelectEnable &&
        setEquals(other.selectedItems, selectedItems) &&
        setEquals(other.selectedDateGroup, selectedDateGroup);
  }

  @override
  int get hashCode =>
      isMultiSelectEnable.hashCode ^
      selectedItems.hashCode ^
      selectedDateGroup.hashCode;
}
