import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class StackReconcileTarget {
  final String stackId;
  final String newPrimaryId;
  final String localAssetId;
  final String localAssetChecksum;

  const StackReconcileTarget({
    required this.stackId,
    required this.newPrimaryId,
    required this.localAssetId,
    required this.localAssetChecksum,
  });
}

enum PriorState { live, trashed, missing }

class DriftStackRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftStackRepository(this._db) : super(_db);

  // Find stacks whose primary should flip back after a revert: a local that was
  // uploaded as an edit (prior in the stack) now hashes to a DIFFERENT member
  // that isn't the primary. Two discriminators keep this from fighting stacks
  // the user arranged by hand: the matched member must not be the local's own
  // prior (a true revert has prior = the edit, member = the base), and the
  // local must be unreconciled (synced_checksum != checksum — the flip below
  // writes synced = checksum, which is what makes this self-limiting). Driven
  // from stack_entity so the work scales with the number of stacks (few), and
  // runs every hash cycle so a flip that failed offline gets retried.
  Future<List<StackReconcileTarget>> findRevertReconcileTargets() async {
    final rows = await _db
        .customSelect(
          '''
        SELECT
          s.id AS stack_id,
          member.id AS new_primary,
          local.id AS local_id,
          local.checksum AS local_checksum
        FROM stack_entity s
        INNER JOIN remote_asset_entity member
          ON member.stack_id = s.id
          AND member.deleted_at IS NULL
        INNER JOIN local_asset_entity local
          ON local.checksum = member.checksum
          AND local.prior_remote_id IS NOT NULL
          AND local.prior_remote_id != member.id
          AND local.synced_checksum IS NOT local.checksum
        INNER JOIN remote_asset_entity prior
          ON prior.id = local.prior_remote_id
          AND prior.stack_id = s.id
          AND prior.deleted_at IS NULL
        WHERE s.primary_asset_id != member.id
        ''',
          readsFrom: {_db.localAssetEntity, _db.remoteAssetEntity, _db.stackEntity},
        )
        .get();

    return rows
        .map(
          (row) => StackReconcileTarget(
            stackId: row.read<String>('stack_id'),
            newPrimaryId: row.read<String>('new_primary'),
            localAssetId: row.read<String>('local_id'),
            localAssetChecksum: row.read<String>('local_checksum'),
          ),
        )
        .toList();
  }

  // A trashed or locked-folder (visibility = 3) remote can't be stacked onto,
  // so it reads as trashed; anything else is live.
  PriorState _stateFromBlocked(bool blocked) => blocked ? PriorState.trashed : PriorState.live;

  // What the synced remote table knows about a stamped prior. missing is
  // ambiguous: either just uploaded and not synced back yet, or hard-deleted on
  // the server — the caller tells them apart via syncedChecksum (null = a chain
  // is still mid-flight, so the row simply hasn't synced yet). A locked-folder
  // row counts as trashed: the server refuses to stack onto it (and with a
  // message the dead-parent belt doesn't match), so defer until it's unlocked.
  Future<PriorState> priorState(String remoteId) async {
    final row = await _db
        .customSelect(
          // 3 = locked
          'SELECT (deleted_at IS NOT NULL OR visibility = 3) AS blocked FROM remote_asset_entity WHERE id = ? LIMIT 1',
          variables: [Variable<String>(remoteId)],
          readsFrom: {_db.remoteAssetEntity},
        )
        .getSingleOrNull();
    if (row == null) {
      return PriorState.missing;
    }
    return _stateFromBlocked(row.read<bool>('blocked'));
  }

  // The synced remote owned by [ownerId] with these exact bytes, if any. The
  // server keys assets by (owner, checksum), so at most one row matches.
  // Locked rows count as trashed here too, same reasoning as [priorState].
  Future<({PriorState state, String? remoteId})> remoteByChecksum(String checksum, String ownerId) async {
    final row = await _db
        .customSelect(
          // 3 = locked
          'SELECT id, (deleted_at IS NOT NULL OR visibility = 3) AS blocked FROM remote_asset_entity WHERE checksum = ? AND owner_id = ? LIMIT 1',
          variables: [Variable<String>(checksum), Variable<String>(ownerId)],
          readsFrom: {_db.remoteAssetEntity},
        )
        .getSingleOrNull();
    if (row == null) {
      return (state: PriorState.missing, remoteId: null);
    }
    return (state: _stateFromBlocked(row.read<bool>('blocked')), remoteId: row.read<String>('id'));
  }

  // The stack a remote asset belongs to, if any. Used by the revert path to find
  // the stack from prior_remote_id when the reverted bytes can't be checksum-matched.
  Future<String?> findStackIdByRemoteId(String remoteId) async {
    final row = await _db
        .customSelect(
          'SELECT stack_id FROM remote_asset_entity WHERE id = ? AND stack_id IS NOT NULL AND deleted_at IS NULL',
          variables: [Variable<String>(remoteId)],
          readsFrom: {_db.remoteAssetEntity},
        )
        .getSingleOrNull();
    return row?.read<String?>('stack_id');
  }

  // The stack's original base member to flip back to on revert: the earliest-
  // uploaded member that isn't the (latest-edit) prior. The base is uploaded
  // before its edits, so oldest uploaded_at = the original.
  Future<String?> findStackBaseId(String stackId, {required String excludeId}) async {
    final row = await _db
        .customSelect(
          '''
          SELECT id FROM remote_asset_entity
          WHERE stack_id = ? AND id != ? AND deleted_at IS NULL
          ORDER BY uploaded_at IS NULL, uploaded_at ASC, id ASC
          LIMIT 1
          ''',
          variables: [Variable<String>(stackId), Variable<String>(excludeId)],
          readsFrom: {_db.remoteAssetEntity},
        )
        .getSingleOrNull();
    return row?.read<String?>('id');
  }

  // Optimistic local primary flip so the timeline updates immediately; the
  // server's stack-update websocket rewrites it shortly after.
  Future<void> setPrimary(String stackId, String primaryAssetId) {
    return (_db.stackEntity.update()..where((e) => e.id.equals(stackId))).write(
      StackEntityCompanion(primaryAssetId: Value(primaryAssetId)),
    );
  }
}
