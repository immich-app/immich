import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class DriftPersonMergeForm extends ConsumerStatefulWidget {
  final DriftPerson person;
  final DriftPerson mergeTarget;

  const DriftPersonMergeForm({super.key, required this.person, required this.mergeTarget});

  @override
  ConsumerState<DriftPersonMergeForm> createState() => _DriftPersonMergeFormState();
}

class _DriftPersonMergeFormState extends ConsumerState<DriftPersonMergeForm> {
  bool _isMerging = false;

  Future<void> _mergePeople(BuildContext context) async {
    setState(() => _isMerging = true);
    try {
      await ref
          .read(driftPeopleServiceProvider)
          .mergePeople(targetPersonId: widget.mergeTarget.id, mergePersonIds: [widget.person.id]);

      // Record the merge in the tracker service
      ref
          .read(personMergeTrackerProvider)
          .recordMerge(mergedPersonId: widget.person.id, targetPersonId: widget.mergeTarget.id);

      if (mounted) {
        Navigator.of(context).pop(widget.mergeTarget);
        ImmichToast.show(
          context: context,
          msg: "merge_people_successfully".tr(),
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.success,
        );
      }
      ref.invalidate(driftGetAllPeopleProvider);
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
    final headers = ApiService.getRequestHeaders();

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
                backgroundImage: NetworkImage(getFaceThumbnailUrl(widget.person.id), headers: headers),
              ),
              const SizedBox(width: 16),
              const RotatedBox(quarterTurns: 1, child: Icon(Icons.merge_type, size: 32)),
              const SizedBox(width: 16),
              CircleAvatar(
                radius: 32,
                backgroundImage: NetworkImage(getFaceThumbnailUrl(widget.mergeTarget.id), headers: headers),
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
          const Text(
            "they_will_be_merged_together",
            style: TextStyle(fontSize: 14, color: Colors.black54),
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
                  onPressed: _isMerging ? null : () => _mergePeople(context),
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
