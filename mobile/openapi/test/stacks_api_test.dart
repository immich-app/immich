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


/// tests for StacksApi
void main() {
  // final instance = StacksApi();

  group('tests for StacksApi', () {
    // Create a stack
    //
    // Create a new stack by providing a name and a list of asset IDs to include in the stack. If any of the provided asset IDs are primary assets of an existing stack, the existing stack will be merged into the newly created stack.
    //
    //Future<StackResponseDto> createStack(StackCreateDto stackCreateDto) async
    test('test createStack', () async {
      // TODO
    });

    // Delete a stack
    //
    // Delete a specific stack by its ID.
    //
    //Future deleteStack(String id) async
    test('test deleteStack', () async {
      // TODO
    });

    // Delete stacks
    //
    // Delete multiple stacks by providing a list of stack IDs.
    //
    //Future deleteStacks(BulkIdsDto bulkIdsDto) async
    test('test deleteStacks', () async {
      // TODO
    });

    // Retrieve a stack
    //
    // Retrieve a specific stack by its ID.
    //
    //Future<StackResponseDto> getStack(String id) async
    test('test getStack', () async {
      // TODO
    });

    // Remove an asset from a stack
    //
    // Remove a specific asset from a stack by providing the stack ID and asset ID.
    //
    //Future removeAssetFromStack(String assetId, String id) async
    test('test removeAssetFromStack', () async {
      // TODO
    });

    // Retrieve stacks
    //
    // Retrieve a list of stacks.
    //
    //Future<List<StackResponseDto>> searchStacks({ String primaryAssetId }) async
    test('test searchStacks', () async {
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

  });
}
