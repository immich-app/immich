import { Route } from '#lib/route.js';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (() => redirect(307, Route.queues())) satisfies PageLoad;
