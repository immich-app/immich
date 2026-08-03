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


/// tests for DeprecatedApi
void main() {
  // final instance = DeprecatedApi();

  group('tests for DeprecatedApi', () {
    // Create a partner
    //
    // Create a new partner to share assets with.
    //
    //Future<PartnerResponseDto> createPartnerDeprecated(String id) async
    test('test createPartnerDeprecated', () async {
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

    // Update an API key
    //
    // Updates the name and permissions of an API key by its ID. The current user must own this API key.
    //
    //Future<ApiKeyResponseDto> updateApiKey(String id, ApiKeyUpdateDto apiKeyUpdateDto) async
    test('test updateApiKey', () async {
      // TODO
    });

    // Update an asset
    //
    // Update information of a specific asset.
    //
    //Future<AssetResponseDto> updateAsset(String id, UpdateAssetDto updateAssetDto) async
    test('test updateAsset', () async {
      // TODO
    });

    // Update assets
    //
    // Updates multiple assets at the same time.
    //
    //Future updateAssets(AssetBulkUpdateDto assetBulkUpdateDto) async
    test('test updateAssets', () async {
      // TODO
    });

    // Update a library
    //
    // Update an existing external library.
    //
    //Future<LibraryResponseDto> updateLibrary(String id, UpdateLibraryDto updateLibraryDto) async
    test('test updateLibrary', () async {
      // TODO
    });

    // Update a memory
    //
    // Update an existing memory by its ID.
    //
    //Future<MemoryResponseDto> updateMemory(String id, MemoryUpdateDto memoryUpdateDto) async
    test('test updateMemory', () async {
      // TODO
    });

    // Update my preferences
    //
    // Update the preferences of the current user.
    //
    //Future<UserPreferencesResponseDto> updateMyPreferences(UserPreferencesUpdateDto userPreferencesUpdateDto) async
    test('test updateMyPreferences', () async {
      // TODO
    });

    // Update current user
    //
    // Update the current user making the API request.
    //
    //Future<UserAdminResponseDto> updateMyUser(UserUpdateMeDto userUpdateMeDto) async
    test('test updateMyUser', () async {
      // TODO
    });

    // Update person
    //
    // Update an individual person.
    //
    //Future<PersonResponseDto> updatePerson(String id, PersonUpdateDto personUpdateDto) async
    test('test updatePerson', () async {
      // TODO
    });

    // Update a session
    //
    // Update a specific session identified by id.
    //
    //Future<SessionResponseDto> updateSession(String id, SessionUpdateDto sessionUpdateDto) async
    test('test updateSession', () async {
      // TODO
    });

    // Update a stack
    //
    // Update an existing stack by its ID.
    //
    //Future<StackResponseDto> updateStack(String id, StackUpdateDto stackUpdateDto) async
    test('test updateStack', () async {
      // TODO
    });

    // Update a tag
    //
    // Update an existing tag identified by its ID.
    //
    //Future<TagResponseDto> updateTag(String id, TagUpdateDto tagUpdateDto) async
    test('test updateTag', () async {
      // TODO
    });

    // Update a user
    //
    // Update an existing user.
    //
    //Future<UserAdminResponseDto> updateUserAdmin(String id, UserAdminUpdateDto userAdminUpdateDto) async
    test('test updateUserAdmin', () async {
      // TODO
    });

    // Update user preferences
    //
    // Update the preferences of a specific user.
    //
    //Future<UserPreferencesResponseDto> updateUserPreferencesAdmin(String id, UserPreferencesUpdateDto userPreferencesUpdateDto) async
    test('test updateUserPreferencesAdmin', () async {
      // TODO
    });

    // Update a workflow
    //
    // Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
    //
    //Future<WorkflowResponseDto> updateWorkflow(String id, WorkflowUpdateDto workflowUpdateDto) async
    test('test updateWorkflow', () async {
      // TODO
    });

  });
}
