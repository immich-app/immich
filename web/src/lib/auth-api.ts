type AdminRegistrationResult = Promise<{
  error?: string
  success?: string
  user?: { email: string }
}>


export async function sendForm(form: HTMLFormElement): AdminRegistrationResult {

  const response = await fetch(form.action, {
    method: form.method,
    body: new FormData(form),
    headers: { accept: 'application/json' },
  })

  return await response.json()
}
