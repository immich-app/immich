import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetEditAction } from 'src/dtos/editing.dto';
import { assetStub } from 'test/fixtures/asset.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { personStub } from 'test/fixtures/person.stub';

describe('mapAsset', () => {
  describe('peopleWithFaces', () => {
    it('should transform all faces when a person has multiple faces in the same image', () => {
      const face1 = {
        ...faceStub.primaryFace1,
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const face2 = {
        ...faceStub.primaryFace1,
        id: 'assetFaceId-second',
        boundingBoxX1: 300,
        boundingBoxY1: 400,
        boundingBoxX2: 400,
        boundingBoxY2: 500,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const asset = {
        ...assetStub.withCropEdit,
        faces: [face1, face2],
        exifInfo: {
          exifImageWidth: 1000,
          exifImageHeight: 800,
        },
      };

      const result = mapAsset(asset as any);

      expect(result.people).toBeDefined();
      expect(result.people).toHaveLength(1);
      expect(result.people![0].faces).toHaveLength(2);

      // Verify that both faces have been transformed (bounding boxes adjusted for crop)
      const firstFace = result.people![0].faces[0];
      const secondFace = result.people![0].faces[1];

      // After crop (x: 216, y: 1512), the coordinates should be adjusted
      // Faces outside the crop area will be clamped
      expect(firstFace.boundingBoxX1).toBe(-116); // 100 - 216 = -116
      expect(firstFace.boundingBoxY1).toBe(-1412); // 100 - 1512 = -1412
      expect(firstFace.boundingBoxX2).toBe(-16); // 200 - 216 = -16
      expect(firstFace.boundingBoxY2).toBe(-1312); // 200 - 1512 = -1312

      expect(secondFace.boundingBoxX1).toBe(84); // 300 - 216
      expect(secondFace.boundingBoxY1).toBe(-1112); // 400 - 1512 = -1112
      expect(secondFace.boundingBoxX2).toBe(184); // 400 - 216
      expect(secondFace.boundingBoxY2).toBe(-1012); // 500 - 1512 = -1012
    });

    it('should transform unassigned faces with edits and dimensions', () => {
      const unassignedFace = {
        ...faceStub.noPerson1,
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const asset = {
        ...assetStub.withCropEdit,
        faces: [unassignedFace],
        exifInfo: {
          exifImageWidth: 1000,
          exifImageHeight: 800,
        },
        edits: [
          {
            action: AssetEditAction.Crop,
            parameters: { x: 50, y: 50, width: 500, height: 400 },
          },
        ],
      };

      const result = mapAsset(asset as any);

      expect(result.unassignedFaces).toBeDefined();
      expect(result.unassignedFaces).toHaveLength(1);

      // Verify that unassigned face has been transformed
      const face = result.unassignedFaces![0];
      expect(face.boundingBoxX1).toBe(50); // 100 - 50
      expect(face.boundingBoxY1).toBe(50); // 100 - 50
      expect(face.boundingBoxX2).toBe(150); // 200 - 50
      expect(face.boundingBoxY2).toBe(150); // 200 - 50
    });

    it('should handle multiple people each with multiple faces', () => {
      const person1Face1 = {
        ...faceStub.primaryFace1,
        id: 'face-1-1',
        person: personStub.withName,
        personId: personStub.withName.id,
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const person1Face2 = {
        ...faceStub.primaryFace1,
        id: 'face-1-2',
        person: personStub.withName,
        personId: personStub.withName.id,
        boundingBoxX1: 300,
        boundingBoxY1: 300,
        boundingBoxX2: 400,
        boundingBoxY2: 400,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const person2Face1 = {
        ...faceStub.mergeFace1,
        id: 'face-2-1',
        person: personStub.mergePerson,
        personId: personStub.mergePerson.id,
        boundingBoxX1: 500,
        boundingBoxY1: 100,
        boundingBoxX2: 600,
        boundingBoxY2: 200,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const asset = {
        ...assetStub.withCropEdit,
        faces: [person1Face1, person1Face2, person2Face1],
        exifInfo: {
          exifImageWidth: 1000,
          exifImageHeight: 800,
        },
        edits: [],
      };

      const result = mapAsset(asset as any);

      expect(result.people).toBeDefined();
      expect(result.people).toHaveLength(2);

      const person1 = result.people!.find((p) => p.id === personStub.withName.id);
      const person2 = result.people!.find((p) => p.id === personStub.mergePerson.id);

      expect(person1).toBeDefined();
      expect(person1!.faces).toHaveLength(2);
      // No edits, so coordinates should be unchanged
      expect(person1!.faces[0].boundingBoxX1).toBe(100);
      expect(person1!.faces[0].boundingBoxY1).toBe(100);
      expect(person1!.faces[1].boundingBoxX1).toBe(300);
      expect(person1!.faces[1].boundingBoxY1).toBe(300);

      expect(person2).toBeDefined();
      expect(person2!.faces).toHaveLength(1);
      expect(person2!.faces[0].boundingBoxX1).toBe(500);
      expect(person2!.faces[0].boundingBoxY1).toBe(100);
    });

    it('should combine faces of the same person into a single entry', () => {
      const face1 = {
        ...faceStub.primaryFace1,
        id: 'face-1',
        person: personStub.withName,
        personId: personStub.withName.id,
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const face2 = {
        ...faceStub.primaryFace1,
        id: 'face-2',
        person: personStub.withName,
        personId: personStub.withName.id,
        boundingBoxX1: 300,
        boundingBoxY1: 300,
        boundingBoxX2: 400,
        boundingBoxY2: 400,
        imageWidth: 1000,
        imageHeight: 800,
      };

      const asset = {
        ...assetStub.withCropEdit,
        faces: [face1, face2],
        exifInfo: {
          exifImageWidth: 1000,
          exifImageHeight: 800,
        },
        edits: [],
      };

      const result = mapAsset(asset as any);

      expect(result.people).toBeDefined();
      expect(result.people).toHaveLength(1);

      const person = result.people![0];
      expect(person.id).toBe(personStub.withName.id);
      expect(person.faces).toHaveLength(2);
    });
  });
});
