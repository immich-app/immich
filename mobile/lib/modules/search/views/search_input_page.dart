import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

@RoutePage()
class SearchInputPage extends HookConsumerWidget {
  const SearchInputPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedPlace = useState('');

    showPeoplePicker() {}

    showPlacePicker() {
      final countries = ['United States', 'Canada', 'Mexico'];
      final cities = [
        'New York',
        'Los Angeles',
        'San Francisco',
        'Chicago',
        'New York',
        'Los Angeles',
        'San Francisco',
        'Chicago',
        'New York',
        'Los Angeles',
        'San Francisco',
        'Chicago',
        'New York',
        'Los Angeles',
        'San Francisco',
        'Chicago'
      ];
      final states = ['NY', 'CA', 'CA', 'IL'];
      showModalBottomSheet(
        context: context,
        builder: (BuildContext context) {
          return Column(
            children: [
              const Text('Select a place'),
              Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: ListWheelScrollView(
                        itemExtent: 60,
                        diameterRatio: 2,
                        onSelectedItemChanged: (value) {
                          HapticFeedback.selectionClick();
                        },
                        children: List.generate(
                          countries.length,
                          (index) {
                            return Container(
                              color: Colors.blue[500],
                              width: double.infinity,
                              child: Text(
                                countries[index],
                                style: context.textTheme.bodyLarge,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    Expanded(
                      child: ListWheelScrollView(
                        itemExtent: 60,
                        diameterRatio: 2,
                        onSelectedItemChanged: (value) {
                          HapticFeedback.selectionClick();
                        },
                        children: List.generate(
                          cities.length,
                          (index) {
                            return Container(
                              color: Colors.red[500],
                              width: double.infinity,
                              child: Text(
                                cities[index],
                                style: context.textTheme.bodyLarge,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    Expanded(
                      child: ListWheelScrollView(
                        itemExtent: 60,
                        diameterRatio: 2,
                        onSelectedItemChanged: (value) {
                          HapticFeedback.selectionClick();
                        },
                        children: List.generate(
                          states.length,
                          (index) {
                            return Container(
                              color: Colors.green[200],
                              width: double.infinity,
                              child: Text(
                                states[index],
                                style: context.textTheme.bodyLarge,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      );
    }

    showCameraPicker() {}

    showDatePicker() {}

    showMediaTypePicker() {}

    showDisplayOptionPicker() {}

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () {
            context.router.pop();
          },
        ),
        title: TextField(
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'search_bar_hint'.tr(),
            hintStyle: context.textTheme.bodyLarge?.copyWith(
              color: context.themeData.colorScheme.onSurface.withOpacity(0.75),
            ),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
          ),
          onSubmitted: (value) {},
        ),
      ),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: SizedBox(
              height: 50,
              child: ListView(
                shrinkWrap: true,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 16),
                children: [
                  SearchFilterChip(onTap: showPeoplePicker, label: 'People'),
                  SearchFilterChip(onTap: showPlacePicker, label: 'Places'),
                  SearchFilterChip(onTap: showCameraPicker, label: 'Camera'),
                  SearchFilterChip(onTap: showDatePicker, label: 'Date'),
                  SearchFilterChip(
                    onTap: showMediaTypePicker,
                    label: 'Media Type',
                  ),
                  SearchFilterChip(
                    onTap: showDisplayOptionPicker,
                    label: 'Display Options',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SearchFilterChip extends StatelessWidget {
  final String label;
  final Function() onTap;
  const SearchFilterChip({super.key, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 0,
        shape:
            StadiumBorder(side: BorderSide(color: Colors.grey.withAlpha(100))),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
          child: Row(
            children: [
              Text(label),
              const Icon(
                Icons.arrow_drop_down,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
