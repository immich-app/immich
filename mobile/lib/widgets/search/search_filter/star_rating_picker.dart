import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';

class StarRatingPicker extends HookWidget {
  const StarRatingPicker({super.key, required this.onSelect, this.filter});
  final Function(SearchRatingFilter) onSelect;
  final SearchRatingFilter? filter;

  @override
  Widget build(BuildContext context) {
    final selectedRating = useState(filter);

    return RadioGroup(
      groupValue: selectedRating.value?.rating,
      onChanged: (int? newValue) {
        if (newValue == null) return;
        final newFilter = SearchRatingFilter(rating: newValue);
        selectedRating.value = newFilter;
        onSelect(newFilter);
      },
      child: Column(
        children: List.generate(
          6,
          (index) => RadioListTile<int>(
            key: Key("star_$index"),
            title: Text('rating_count'.t(args: {'count': (index)})),
            value: index,
          ),
        ),
      ),
    );
  }
}
