import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';
import PersonEditBirthDateModal from './PersonEditBirthDateModal.svelte';

afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
});

describe('PersonEditBirthDateModal', () => {
  it('submits the current date input value without requiring blur first', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(PersonEditBirthDateModal, { props: { birthDate: null, onSave, onClose } });

    const input = document.querySelector('input[name="birthDate"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '1990-06-15' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('1990-06-15'));
    expect(onClose).toHaveBeenCalled();
  });

  it('submits an empty birthdate when clearing an existing date', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(PersonEditBirthDateModal, { props: { birthDate: '1990-06-15', onSave, onClose: vi.fn() } });

    await userEvent.click(screen.getByRole('button', { name: 'clear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(''));
  });
});
