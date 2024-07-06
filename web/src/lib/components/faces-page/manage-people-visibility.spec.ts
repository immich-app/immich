import { sdkMock } from '$lib/__mocks__/sdk.mock';
import ManagePeopleVisibility from '$lib/components/faces-page/manage-people-visibility.svelte';
import type { PersonResponseDto } from '@immich/sdk';
import { personFactory } from '@test-data/factories/person-factory';
import { render } from '@testing-library/svelte';

describe('ManagePeopleVisibility Component', () => {
  let personVisible: PersonResponseDto;
  let personHidden: PersonResponseDto;
  let personWithoutName: PersonResponseDto;

  beforeAll(() => {
    // Prevents errors from `img.decode()` in ImageThumbnail
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    personVisible = personFactory.build({ isHidden: false });
    personHidden = personFactory.build({ isHidden: true });
    personWithoutName = personFactory.build({ isHidden: false, name: undefined });
    sdkMock.updatePeople.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('does not update people when no changes are made', () => {
    const { getByText } = render(ManagePeopleVisibility, {
      props: {
        people: [personVisible, personHidden, personWithoutName],
        onClose: vi.fn(),
      },
    });

    const saveButton = getByText('done');
    saveButton.click();
    expect(sdkMock.updatePeople).not.toHaveBeenCalled();
  });

  it('hides unnamed people on first button press', () => {
    const { getByText, getByTitle } = render(ManagePeopleVisibility, {
      props: {
        people: [personVisible, personHidden, personWithoutName],
        onClose: vi.fn(),
      },
    });

    const toggleButton = getByTitle('toggle_visibility');
    toggleButton.click();
    const saveButton = getByText('done');
    saveButton.click();

    expect(sdkMock.updatePeople).toHaveBeenCalledWith({
      peopleUpdateDto: {
        people: [{ id: personWithoutName.id, isHidden: true }],
      },
    });
  });

  it('hides all people on second button press', () => {
    const { getByText, getByTitle } = render(ManagePeopleVisibility, {
      props: {
        people: [personVisible, personHidden, personWithoutName],
        onClose: vi.fn(),
      },
    });

    const toggleButton = getByTitle('toggle_visibility');
    toggleButton.click();
    toggleButton.click();
    const saveButton = getByText('done');
    saveButton.click();

    expect(sdkMock.updatePeople).toHaveBeenCalledWith({
      peopleUpdateDto: {
        people: expect.arrayContaining([
          { id: personVisible.id, isHidden: true },
          { id: personWithoutName.id, isHidden: true },
        ]),
      },
    });
  });

  it('shows all people on third button press', () => {
    const { getByText, getByTitle } = render(ManagePeopleVisibility, {
      props: {
        people: [personVisible, personHidden, personWithoutName],
        onClose: vi.fn(),
      },
    });

    const toggleButton = getByTitle('toggle_visibility');
    toggleButton.click();
    toggleButton.click();
    toggleButton.click();
    const saveButton = getByText('done');
    saveButton.click();

    expect(sdkMock.updatePeople).toHaveBeenCalledWith({
      peopleUpdateDto: {
        people: [{ id: personHidden.id, isHidden: false }],
      },
    });
  });
});
