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


/// tests for FacesApi
void main() {
  // final instance = FacesApi();

  group('tests for FacesApi', () {
    // Create a face
    //
    // Create a new face that has not been discovered by facial recognition. The content of the bounding box is considered a face.
    //
    //Future createFace(AssetFaceCreateDto assetFaceCreateDto) async
    test('test createFace', () async {
      // TODO
    });

    // Delete a face
    //
    // Delete a face identified by the id. Optionally can be force deleted.
    //
    //Future deleteFace(String id, AssetFaceDeleteDto assetFaceDeleteDto) async
    test('test deleteFace', () async {
      // TODO
    });

    // Retrieve faces for asset
    //
    // Retrieve all faces belonging to an asset.
    //
    //Future<List<AssetFaceResponseDto>> getFaces(String id) async
    test('test getFaces', () async {
      // TODO
    });

    // Re-assign a face to another person
    //
    // Re-assign the face provided in the body to the person identified by the id in the path parameter.
    //
    //Future<PersonResponseDto> reassignFacesById(String id, FaceDto faceDto) async
    test('test reassignFacesById', () async {
      // TODO
    });

  });
}
