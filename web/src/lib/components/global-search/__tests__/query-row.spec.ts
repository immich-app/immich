import QueryRow from '$lib/components/global-search/rows/query-row.svelte';
import { render, screen } from '@testing-library/svelte';

describe('query-row', () => {
  it('renders the query recent row with a magnify icon and text', () => {
    const { container } = render(QueryRow, {
      props: { entry: { text: 'beach' } },
    });

    expect(screen.getByTestId('query-row')).toBeInTheDocument();
    expect(screen.getByText('beach')).toBeVisible();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
