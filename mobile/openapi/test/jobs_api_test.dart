//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';


/// tests for JobsApi
void main() {
  // final instance = JobsApi();

  group('tests for JobsApi', () {
    // Create a manual job
    //
    // Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.
    //
    //Future createJob(JobCreateDto jobCreateDto) async
    test('test createJob', () async {
      // TODO
    });

    // Retrieve queue counts and status
    //
    // Retrieve the counts of the current queue, as well as the current status.
    //
    //Future<QueuesResponseLegacyDto> getQueuesLegacy() async
    test('test getQueuesLegacy', () async {
      // TODO
    });

    // Run jobs
    //
    // Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
    //
    //Future<QueueResponseLegacyDto> runQueueCommandLegacy(QueueName name, QueueCommandDto queueCommandDto) async
    test('test runQueueCommandLegacy', () async {
      // TODO
    });

  });
}
