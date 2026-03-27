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

  it('should exclude unnamed people entirely', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice' }),
      makePerson({ id: 'p2', name: '', alias: null }),
      makePerson({ id: 'p3', name: '', alias: null }),
      makePerson({ id: 'p4', name: 'Bob' }),
    ];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('person-thumb-p1')).toBeInTheDocument();
    expect(screen.queryByTestId('person-thumb-p2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('person-thumb-p3')).not.toBeInTheDocument();
    expect(screen.getByTestId('person-thumb-p4')).toBeInTheDocument();
  });

  it('should render nothing when all people are unnamed', () => {
    const people = [makePerson({ id: 'p1', name: '', alias: null }), makePerson({ id: 'p2', name: '', alias: null })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.queryByTestId('people-strip')).not.toBeInTheDocument();
  });

  it('should exclude hidden people', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', name: 'Bob', isHidden: true }),
      makePerson({ id: 'p3', name: 'Carol', isHidden: false }),
    ];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('person-thumb-p1')).toBeInTheDocument();
    expect(screen.queryByTestId('person-thumb-p2')).not.toBeInTheDocument();
    expect(screen.getByTestId('person-thumb-p3')).toBeInTheDocument();
  });

  it('should keep people with alias even if name is empty', () => {
    const people = [makePerson({ id: 'p1', name: '', alias: 'Mom' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });
    expect(screen.getByTestId('person-thumb-p1')).toBeInTheDocument();
    expect(screen.getByTestId('person-label-p1')).toHaveTextContent('Mom');
  });

  it('should show selected state with ring when person is in selectedPersonIds', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', selectedPersonIds: ['p1'] });
    const ring = screen.getByTestId('person-ring-p1');
    expect(ring.className).toContain('ring-2');
  });

  it('should not show ring when person is not in selectedPersonIds', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', selectedPersonIds: [] });
    const ring = screen.getByTestId('person-ring-p1');
    expect(ring.className).not.toContain('ring-2');
  });

  it('should highlight multiple selected people', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice' }),
      makePerson({ id: 'p2', name: 'Bob' }),
      makePerson({ id: 'p3', name: 'Carol' }),
    ];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', selectedPersonIds: ['p1', 'p3'] });
    expect(screen.getByTestId('person-ring-p1').className).toContain('ring-2');
    expect(screen.getByTestId('person-ring-p2').className).not.toContain('ring-2');
    expect(screen.getByTestId('person-ring-p3').className).toContain('ring-2');
  });

  it('should not break when selectedPersonIds contains unknown IDs', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', selectedPersonIds: ['p1', 'unknown-id'] });
    expect(screen.getByTestId('person-ring-p1').className).toContain('ring-2');
  });

  it('should call onPersonClick when a person is clicked', async () => {
    const onPersonClick = vi.fn();
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    render(SpacePeopleStrip, { people, spaceId: 'space-1', onPersonClick });
    await fireEvent.click(screen.getByTestId('person-thumb-p1'));
    expect(onPersonClick).toHaveBeenCalledWith('p1');
  });

  it('should display named people sorted by assetCount descending', () => {
    const people = [
      makePerson({ id: 'named-few', name: 'Alice', assetCount: 2 }),
      makePerson({ id: 'named-many', name: 'Bob', assetCount: 50 }),
      makePerson({ id: 'unnamed-many', name: '', assetCount: 100 }),
    ];
    render(SpacePeopleStrip, { people, spaceId: 'space-1' });

    const buttons = screen.getAllByTestId(/^person-thumb-/);
    // Named only (unnamed filtered out), sorted by assetCount desc
    expect(buttons[0]).toHaveAttribute('data-testid', 'person-thumb-named-many');
    expect(buttons[1]).toHaveAttribute('data-testid', 'person-thumb-named-few');
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
