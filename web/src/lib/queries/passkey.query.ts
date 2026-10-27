import { asMutation, MutationCancelledError, queryClient } from '#lib/queries/client.ts';
import {
  deletePasskey,
  finishAuthentication,
  finishRegistration,
  searchPasskeys,
  startAuthentication,
  startRegistration,
  updatePasskey,
} from '@immich/sdk';
import {
  startAuthentication as startBrowserAuthentication,
  startRegistration as startBrowserRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { mutationOptions, queryOptions } from '@tanstack/svelte-query';

const isPasskeyCancelled = (error: unknown) => error instanceof Error && error.name === 'NotAllowedError';

const withPasskeyPrompt = async <T>(flow: () => Promise<T>) => {
  try {
    return await flow();
  } catch (error) {
    throw isPasskeyCancelled(error) ? new MutationCancelledError() : error;
  }
};

export const searchPasskeysQuery = () =>
  queryOptions({
    queryKey: ['passkeys'],
    queryFn: ({ signal }) => searchPasskeys({}, { signal }),
  });

export const createPasskeyMutation = () =>
  mutationOptions({
    mutationFn: () =>
      withPasskeyPrompt(async () => {
        const options = await startRegistration();
        const response = await startBrowserRegistration({
          optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
        });
        return finishRegistration({ passkeyRegistrationFinishDto: { response } });
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: searchPasskeysQuery().queryKey, exact: true }),
  });

export const loginWithPasskeyMutation = () =>
  mutationOptions({
    mutationFn: () =>
      withPasskeyPrompt(async () => {
        const options = await startAuthentication();
        const response = await startBrowserAuthentication({
          optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
        });
        return finishAuthentication({ passkeyAuthenticationFinishDto: { response } });
      }),
    meta: { error: { toast: false } },
  });

export const updatePasskeyMutation = () =>
  asMutation(updatePasskey, {
    onSuccess: (passkey) =>
      queryClient.setQueryData(searchPasskeysQuery().queryKey, (passkeys) =>
        passkeys?.map((item) => (item.id === passkey.id ? passkey : item)),
      ),
    meta: { success: { toast: true } },
  });

export const deletePasskeyMutation = () =>
  asMutation(deletePasskey, {
    onSuccess: (_, [{ id }]) =>
      queryClient.setQueryData(searchPasskeysQuery().queryKey, (passkeys) =>
        passkeys?.filter((passkey) => passkey.id !== id),
      ),
  });
