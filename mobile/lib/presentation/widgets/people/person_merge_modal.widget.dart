import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class PersonMergeForm extends ConsumerStatefulWidget {
  final Person person;
  final Person mergeTarget;

  const PersonMergeForm({super.key, required this.person, required this.mergeTarget});

  @override
  ConsumerState<PersonMergeForm> createState() => _PersonMergeFormState();
}

class _PersonMergeFormState extends ConsumerState<PersonMergeForm> {
  bool _isMerging = false;

  Future<void> _mergePeople() async {
    setState(() => _isMerging = true);
    try {
      await ref
          .read(peopleServiceProvider)
          .mergePeople(targetPersonId: widget.mergeTarget.id, mergePersonIds: [widget.person.id]);

      if (mounted) {
        Navigator.of(context).pop(widget.mergeTarget);
        ImmichToast.show(
          context: context,
          msg: "merge_people_successfully".tr(),
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.success,
        );
      }
      ref.invalidate(getAllPeopleProvider);
    } catch (e) {
      if (mounted) {
        setState(() => _isMerging = false);
        ImmichToast.show(
          context: context,
          msg: "error_title".tr(),
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text("merge_people", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(widget.person.id)),
              ),
              const SizedBox(width: 16),
              const RotatedBox(quarterTurns: 1, child: Icon(Icons.merge_type, size: 32)),
              const SizedBox(width: 16),
              CircleAvatar(
                radius: 32,
                backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(widget.mergeTarget.id)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            "are_these_the_same_person",
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
            textAlign: TextAlign.center,
          ).tr(),
          const SizedBox(height: 8),
          Text(
            "they_will_be_merged_together",
            style: TextStyle(fontSize: 14, color: Theme.of(context).textTheme.bodyMedium?.color),
            textAlign: TextAlign.center,
          ).tr(),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.onSurface,
                    foregroundColor: Theme.of(context).colorScheme.onInverseSurface,
                    elevation: 0,
                  ),
                  onPressed: _isMerging ? null : () => Navigator.of(context).pop(),
                  child: const Text("no", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Theme.of(context).colorScheme.onPrimary,
                  ),
                  onPressed: _isMerging ? null : () => unawaited(_mergePeople()),
                  child: _isMerging
                      ? SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Theme.of(context).colorScheme.onPrimary,
                          ),
                        )
                      : const Text("yes", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
