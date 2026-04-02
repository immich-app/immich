import 'dart:math';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_people.provider.dart';
import 'package:immich_mobile/widgets/photo_view/src/controller/photo_view_controller.dart';
import 'package:openapi/api.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class FaceBoundingBoxOverlay extends ConsumerWidget {
  final BaseAsset asset;
  final PhotoViewControllerBase? controller;
  final Size viewportSize;

  const FaceBoundingBoxOverlay({
    super.key,
    required this.asset,
    required this.controller,
    required this.viewportSize,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (controller == null || asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final peopleState = ref.watch(assetPeopleNotifierProvider(asset as RemoteAsset));
    final people = peopleState.valueOrNull ?? [];

    if (people.isEmpty) return const SizedBox.shrink();

    // Only render PET bounding boxes
    final pets = people.where((p) => p.type == PersonType.PET).toList();
    if (pets.isEmpty) return const SizedBox.shrink();

    return StreamBuilder<PhotoViewControllerValue>(
      stream: controller!.outputStateStream,
      initialData: controller!.value,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox.shrink();

        final value = snapshot.data!;
        final scale = value.scale ?? 1.0;
        final position = value.position;

        final imageWidth = asset.width?.toDouble() ?? viewportSize.width;
        final imageHeight = asset.height?.toDouble() ?? viewportSize.height;

        final baseScale = min(
          viewportSize.width / imageWidth,
          viewportSize.height / imageHeight,
        );
        final actualScale = baseScale * scale;

        final topLeftX = viewportSize.width / 2 + position.dx - (imageWidth * actualScale) / 2;
        final topLeftY = viewportSize.height / 2 + position.dy - (imageHeight * actualScale) / 2;

        return Stack(
          children: pets.expand((person) {
            return person.faces.map((face) {
              final rectLeft = topLeftX + face.boundingBoxX1 * actualScale;
              final rectTop = topLeftY + face.boundingBoxY1 * actualScale;
              final rectWidth = (face.boundingBoxX2 - face.boundingBoxX1) * actualScale;
              final rectHeight = (face.boundingBoxY2 - face.boundingBoxY1) * actualScale;

              return Positioned(
                left: rectLeft,
                top: rectTop,
                width: rectWidth,
                height: rectHeight,
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: context.colorScheme.primary, width: 3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Align(
                    alignment: Alignment.topLeft,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: context.colorScheme.primary,
                        borderRadius: const BorderRadius.only(
                          bottomRight: Radius.circular(8),
                        ),
                      ),
                      child: const Icon(
                        Icons.pets,
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              );
            });
          }).toList(),
        );
      },
    );
  }
}
