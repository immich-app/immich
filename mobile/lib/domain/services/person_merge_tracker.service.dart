/// Why do we need this?
/// Say we open the profile page (drift_person.page.dart) for Person A, and then nested above
/// a image viewer for an image that belongs to Person A.
///
/// When the users now merges user A into user B, we can't just listen to
/// the changes in the profile page, we have to keep track of where the user A (now B)
/// can be found in the DB.
///
/// So when popping back to the profile page (and the user is missing), we check
/// which other person B we have to display instead.
class PersonMergeTrackerService {
  /// Map of merged person ID -> target person ID
  final Map<String, String> _mergeForwardingMap = {};

  /// Record a person merge operation
  void recordMerge({required String mergedPersonId, required String targetPersonId}) {
    _mergeForwardingMap[mergedPersonId] = targetPersonId;
  }

  /// Get the target person ID for a merged person
  String? getTargetPersonId(String personId) {
    return _mergeForwardingMap[personId];
  }
}
