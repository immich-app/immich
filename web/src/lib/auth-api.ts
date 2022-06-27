type AdminRegistrationResult = Promise<{
	error?: string;
	success?: string;
	user?: {
		email: string;
	};
}>;

type LoginResult = Promise<{
	error?: string;
	success?: string;
	user?: {
		accessToken: string;
		firstName: string;
		lastName: string;
		isAdmin: boolean;
		id: string;
		email: string;
		shouldChangePassword: boolean;
	};
}>;

type UpdateResult = Promise<{
	error?: string;
	success?: string;
	user?: {
		accessToken: string;
		firstName: string;
		lastName: string;
		isAdmin: boolean;
		id: string;
		email: string;
	};
}>;

export async function sendRegistrationForm(form: HTMLFormElement): AdminRegistrationResult {
	const response = await fetch(form.action, {
		method: form.method,
		body: new FormData(form),
		headers: { accept: 'application/json' },
	});

	return await response.json();
}

export async function sendLoginForm(form: HTMLFormElement): LoginResult {
	const response = await fetch(form.action, {
		method: form.method,
		body: new FormData(form),
		headers: { accept: 'application/json' },
	});

	return await response.json();
}

export async function sendUpdateForm(form: HTMLFormElement): UpdateResult {
	const response = await fetch(form.action, {
		method: form.method,
		body: new FormData(form),
		headers: { accept: 'application/json' },
	});

	return await response.json();
}
