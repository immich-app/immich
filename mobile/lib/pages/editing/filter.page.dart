import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/constants/filters.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/routing/router.dart';

/// A widget for filtering an image.
/// This widget uses [HookWidget] to manage its lifecycle and state. It allows
/// users to add filters to an image and then navigate to the [EditImagePage] with the
/// final composition.'
@RoutePage()
class FilterImagePage extends HookWidget {
  final Image image;
  final Asset asset;

  const FilterImagePage({
    super.key,
    required this.image,
    required this.asset,
  });

  @override
  Widget build(BuildContext context) {
    final colorFilter = useState<ColorFilter>(filters[0]);
    final selectedFilterIndex = useState<int>(0);

    Future<ui.Image> createFilteredImage(
      ui.Image inputImage,
      ColorFilter filter,
    ) {
      final completer = Completer<ui.Image>();
      final size =
          Size(inputImage.width.toDouble(), inputImage.height.toDouble());
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);

      final paint = Paint()..colorFilter = filter;
      canvas.drawImage(inputImage, Offset.zero, paint);

      recorder
          .endRecording()
          .toImage(size.width.round(), size.height.round())
          .then((image) {
        completer.complete(image);
      });

      return completer.future;
    }

    void applyFilter(ColorFilter filter, int index) {
      colorFilter.value = filter;
      selectedFilterIndex.value = index;
    }

    Future<Image> applyFilterAndConvert(ColorFilter filter) async {
      final completer = Completer<ui.Image>();
      image.image.resolve(ImageConfiguration.empty).addListener(
        ImageStreamListener((ImageInfo info, bool _) {
          completer.complete(info.image);
        }),
      );
      final uiImage = await completer.future;

      final filteredUiImage = await createFilteredImage(uiImage, filter);
      final byteData =
          await filteredUiImage.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData!.buffer.asUint8List();

      return Image.memory(pngBytes, fit: BoxFit.contain);
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.scaffoldBackgroundColor,
        title: Text("filter".tr()),
        leading: CloseButton(color: context.primaryColor),
        actions: [
          IconButton(
            icon: Icon(
              Icons.done_rounded,
              color: context.primaryColor,
              size: 24,
            ),
            onPressed: () async {
              final filteredImage =
                  await applyFilterAndConvert(colorFilter.value);
              context.pushRoute(
                EditImageRoute(
                  asset: asset,
                  image: filteredImage,
                  isEdited: true,
                ),
              );
            },
          ),
        ],
      ),
      backgroundColor: context.scaffoldBackgroundColor,
      body: Column(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: Center(
              child: ColorFiltered(
                colorFilter: colorFilter.value,
                child: image,
              ),
            ),
          ),
          SizedBox(
            height: 120,
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
          ),
        ],
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
