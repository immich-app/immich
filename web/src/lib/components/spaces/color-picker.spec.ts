import ColorPicker from '$lib/components/spaces/color-picker.svelte';
import type { UserAvatarColor } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// UserAvatarColor enum values are just lowercase strings
const Primary = 'primary' as UserAvatarColor;
const Pink = 'pink' as UserAvatarColor;
const Red = 'red' as UserAvatarColor;
const Yellow = 'yellow' as UserAvatarColor;
const Blue = 'blue' as UserAvatarColor;
const Green = 'green' as UserAvatarColor;
const Purple = 'purple' as UserAvatarColor;
const Orange = 'orange' as UserAvatarColor;
const Gray = 'gray' as UserAvatarColor;
const Amber = 'amber' as UserAvatarColor;

const allColors = [Primary, Pink, Red, Yellow, Blue, Green, Purple, Orange, Gray, Amber];

describe('ColorPicker', () => {
  it('should render all 10 color swatches', () => {
    render(ColorPicker, { value: Primary, onchange: vi.fn() });
    const swatches = screen.getAllByRole('button');
    expect(swatches).toHaveLength(10);
  });

  it('should render a swatch for each color value', () => {
    render(ColorPicker, { value: Primary, onchange: vi.fn() });
    for (const color of allColors) {
      expect(screen.getByTestId(`color-swatch-${color}`)).toBeInTheDocument();
    }
  });

  it('should apply ring classes to the selected color', () => {
    render(ColorPicker, { value: Blue, onchange: vi.fn() });
    const selected = screen.getByTestId(`color-swatch-${Blue}`);
    expect(selected.className).toContain('ring-2');
    expect(selected.className).toContain('scale-110');
  });

  it('should not apply ring classes to unselected colors', () => {
    render(ColorPicker, { value: Blue, onchange: vi.fn() });
    const unselected = screen.getByTestId(`color-swatch-${Red}`);
    expect(unselected.className).not.toContain('ring-2');
    expect(unselected.className).not.toContain('scale-110');
  });

  it('should show check icon only on the selected color', () => {
    render(ColorPicker, { value: Green, onchange: vi.fn() });
    const selectedButton = screen.getByTestId(`color-swatch-${Green}`);
    const unselectedButton = screen.getByTestId(`color-swatch-${Red}`);
    expect(selectedButton.querySelector('svg')).not.toBeNull();
    expect(unselectedButton.querySelector('svg')).toBeNull();
  });

  it('should set aria-label to the color value', () => {
    render(ColorPicker, { value: Primary, onchange: vi.fn() });
    const swatch = screen.getByTestId(`color-swatch-${Purple}`);
    expect(swatch).toHaveAttribute('aria-label', Purple);
  });

  it('should call onchange with the clicked color value', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(ColorPicker, { value: Primary, onchange });

    await user.click(screen.getByTestId(`color-swatch-${Orange}`));
    expect(onchange).toHaveBeenCalledWith(Orange);
  });

  it('should call onchange when clicking the already-selected color', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(ColorPicker, { value: Red, onchange });

    await user.click(screen.getByTestId(`color-swatch-${Red}`));
    expect(onchange).toHaveBeenCalledWith(Red);
  });
});
