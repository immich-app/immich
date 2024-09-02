import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/constants/filters.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:auto_route/auto_route.dart';

@RoutePage()
class FilterImagePage extends HookWidget {
  final Image image;
  final Asset asset;
  const FilterImagePage({super.key, required this.image, required this.asset});

  @override
  Widget build(BuildContext context) {
    final colorFilter = useState<ColorFilter>(filters[0]);
    final selectedFilterIndex = useState<int>(0);

    void applyFilter(ColorFilter filter, int index) {
      colorFilter.value = filter;
      selectedFilterIndex.value = index;
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.scaffoldBackgroundColor,
        title: Text("filters".tr()),
        leading: CloseButton(color: context.primaryColor),
        actions: [
          IconButton(
            icon: Icon(
              Icons.done_rounded,
              color: context.primaryColor,
              size: 24,
            ),
            onPressed: () async {
              //context.pushRoute(
              //EditImageRoute(
              //asset: asset,
              //image: ,
              //isEdited: true,
              //),
              //);
            },
          ),
        ],
      ),
      backgroundColor: context.scaffoldBackgroundColor,
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          return Column(
            children: [
              Container(
                padding: const EdgeInsets.only(top: 20),
                width: double.infinity,
                height: constraints.maxHeight * 0.8,
                child: ColorFiltered(
                  colorFilter: colorFilter.value,
                  child: image,
                ),
              ),
              Expanded(
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                      child: _FilterButton(
                        image: image,
                        label: filterNames[index],
                        filter: filters[index],
                        isSelected: selectedFilterIndex.value == index,
                        onTap: () => applyFilter(filters[index], index),
                      ),
                    );
                  },
                ),
              )
            ],
          );
        },
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  final Image image;
  final String label;
  final ColorFilter filter;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterButton({
    required this.image,
    required this.label,
    required this.filter,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: isSelected
                  ? Border.all(color: context.primaryColor, width: 3)
                  : null,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: ColorFiltered(
                colorFilter: filter,
                child: FittedBox(
                  fit: BoxFit.cover,
                  child: image,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
