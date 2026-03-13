import SpacePeopleStrip from '$lib/components/spaces/space-people-strip.svelte';
import type { SharedSpacePersonResponseDto } from '@immich/sdk';
import { fireEvent, render, screen } from '@testing-library/svelte';

const makePerson = (overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto => ({
  id: 'person-1',
  spaceId: 'space-1',
  name: 'Alice',
  alias: null,
  thumbnailPath: '/path/to/thumb.jpg',
  assetCount: 5,
  faceCount: 3,
  isHidden: false,
  representativeFaceId: 'face-1',
  birthDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('SpacePeopleStrip', () => {
  it('should render nothing when people list is empty', () => {
    render(SpacePeopleStrip, { people: [], spaceId: 'space-1' });
    expect(screen.queryByTestId('people-strip')).not.toBeInTheDocument();
  });

  it('should render face thumbnails for each person', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('people-strip')).toBeInTheDocument();
    expect(screen.getByTestId('person-thumb-p1')).toBeInTheDocument();
    expect(screen.getByTestId('person-thumb-p2')).toBeInTheDocument();
  });

  it('should display alias if present, otherwise name', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('person-label-p1')).toHaveTextContent('Mom');
  });

  it('should display name when no alias', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice Johnson', alias: null })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('person-label-p1')).toHaveTextContent('Alice Johnson');
  });

  it('should not show label when no name or alias', () => {
    const people = [makePerson({ id: 'p1', name: '', alias: null })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.queryByTestId('person-label-p1')).not.toBeInTheDocument();
  });

  it('should show selected state with ring when selectedPersonId matches', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', selectedPersonId: 'p1' });
    const ring = screen.getByTestId('person-ring-p1');
    expect(ring.className).toContain('ring-2');
  });

  it('should not show ring when not selected', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    const ring = screen.getByTestId('person-ring-p1');
    expect(ring.className).not.toContain('ring-2');
  });

  it('should call onPersonClick when a person is clicked', async () => {
    const onPersonClick = vi.fn();
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', onPersonClick });
    await fireEvent.click(screen.getByTestId('person-thumb-p1'));
    expect(onPersonClick).toHaveBeenCalledWith('p1');
  });

  it('should show "See all" link when people count exceeds threshold', () => {
    const people = Array.from({ length: 8 }, (_, i) => makePerson({ id: `p${i}`, name: `Person ${i}` }));
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('see-all-people')).toBeInTheDocument();
  });

  it('should link to people page', () => {
    const people = Array.from({ length: 10 }, (_, i) => makePerson({ id: `p${i}`, name: `Person ${i}` }));
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    const link = screen.getByTestId('see-all-people');
    expect(link.getAttribute('href')).toBe('/spaces/space-1/people');
  });
});
