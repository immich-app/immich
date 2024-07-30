import Button from '$lib/components/elements/buttons/button.svelte';
import { render, screen } from '@testing-library/svelte';

describe('Button component', () => {
  it('should render as a button', () => {
    render(Button);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('href');
  });

  it('should render as a link if href prop is set', () => {
    render(Button, { props: { href: '/test' } });
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).not.toHaveAttribute('type');
  });
});
