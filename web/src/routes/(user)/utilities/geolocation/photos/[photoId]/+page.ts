import { Route } from '$lib/route';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (({ params }) => redirect(307, Route.viewAsset({ id: params.photoId }))) satisfies PageLoad;
