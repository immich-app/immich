import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
import { render, screen } from '@testing-library/svelte';

describe('CircleIconButton component', () => {
  it('should render as a button', () => {
    render(CircleIconButton, { icon: '', title: 'test' });
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('href');
    expect(button).toHaveAttribute('title', 'test');
  });

  it('should render as a link if href prop is set', () => {
    render(CircleIconButton, { props: { href: '/test', icon: '', title: 'test' } });
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).not.toHaveAttribute('type');
  });

  it('should render icon inside button', () => {
    render(CircleIconButton, { icon: '', title: 'test' });
    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'test');
  });
});
