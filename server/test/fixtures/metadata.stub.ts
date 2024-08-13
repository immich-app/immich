import { ImmichTags } from 'src/interfaces/metadata.interface';
import { personStub } from 'test/fixtures/person.stub';

export const metadataStub = {
  empty: Object.freeze<ImmichTags>({}),
  withFace: Object.freeze<ImmichTags>({
    RegionInfo: {
      AppliedToDimensions: {
        W: 100,
        H: 100,
        Unit: 'normalized',
      },
      RegionList: [
        {
          Type: 'face',
          Name: personStub.withName.name,
          Area: {
            X: 0.05,
            Y: 0.05,
            W: 0.1,
            H: 0.1,
            Unit: 'normalized',
          },
        },
      ],
    },
  }),
  withFaceEmptyName: Object.freeze<ImmichTags>({
    RegionInfo: {
      AppliedToDimensions: {
        W: 100,
        H: 100,
        Unit: 'normalized',
      },
      RegionList: [
        {
          Type: 'face',
          Name: '',
          Area: {
            X: 0.05,
            Y: 0.05,
            W: 0.1,
            H: 0.1,
            Unit: 'normalized',
          },
        },
      ],
    },
  }),
  withFaceNoName: Object.freeze<ImmichTags>({
    RegionInfo: {
      AppliedToDimensions: {
        W: 100,
        H: 100,
        Unit: 'normalized',
      },
      RegionList: [
        {
          Type: 'face',
          Area: {
            X: 0.05,
            Y: 0.05,
            W: 0.1,
            H: 0.1,
            Unit: 'normalized',
          },
        },
      ],
    },
  }),
};
