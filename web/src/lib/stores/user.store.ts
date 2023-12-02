import { writable } from 'svelte/store';
import type { UserResponseDto } from '@api';

export const user = writable<UserResponseDto | null>(null);
