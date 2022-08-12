<script lang="ts">
  import { api, UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import AccountEditOutline from 'svelte-material-icons/AccountEditOutline.svelte';

  export let user: UserResponseDto;

  let error: string;
  let success: string;

  const dispatch = createEventDispatcher();

  // eslint-disable-next-line no-undef
  const editUser = async (event: SubmitEvent) => {

    const formElement = event.target as HTMLFormElement;
    const form = new FormData(formElement);

    const firstName = form.get('firstName');
    const lastName = form.get('lastName');


    const {status} = await api.userApi.updateUser({
      id: user.id,
      firstName: firstName.toString(),
      lastName: lastName.toString()
    }).catch(e => console.log("Error updating user ", e));

    if (status == 200) {
      dispatch('edit-success');
    }
  }

  const resetPassword = async () => {
    const defaultPassword = 'password'

    const {status} = await api.userApi.updateUser({
      id: user.id,
      password: defaultPassword,
      shouldChangePassword: true,

    }).catch(e => console.log("Error updating user ", e));

    if (status == 200) {
      dispatch('reset-password-success');
    }
  }
</script>

<div class="border bg-white p-4 shadow-sm w-[500px] rounded-3xl py-8">
    <div class="flex flex-col place-items-center place-content-center gap-4 px-4">
        <!--        <img class="text-center" src="/immich-logo.svg" height="100" width="100" alt="immich-logo"/>-->
        <AccountEditOutline size="4em" color="#4250affe"/>
        <h1 class="text-2xl text-immich-primary font-medium">Edit user</h1>
    </div>

    <form on:submit|preventDefault={editUser} autocomplete="off">
        <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="email">Email
                (cannot change)</label>
            <input class="immich-form-input disabled:bg-gray-200 hover:cursor-not-allowed"
                   id="email" name="email"
                   type="email" disabled
                   bind:value={user.email}/>
        </div>


        <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="firstName">First Name</label>
            <input class="immich-form-input" id="firstName" name="firstName" type="text" required
                   bind:value={user.firstName}/>
        </div>

        <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="lastName">Last Name</label>
            <input class="immich-form-input" id="lastName" name="lastName" type="text" required
                   bind:value={user.lastName}/>
        </div>


        {#if error}
            <p class="text-red-400 ml-4 text-sm">{error}</p>
        {/if}

        {#if success}
            <p class="text-immich-primary ml-4 text-sm">{success}</p>
        {/if}
        <div class="flex w-full px-4 gap-4 mt-8">
            <button on:click={resetPassword}
                    class="flex-1 transition-colors bg-[#F9DEDC] hover:bg-red-50 text-[#410E0B] px-6 py-3 rounded-full w-full font-medium"

            >Reset password
            </button
            >
            <button
                    type="submit"
                    class="flex-1 transition-colors bg-immich-primary hover:bg-immich-primary/75 px-6 py-3 text-white rounded-full shadow-md w-full font-medium"
            >Confirm
            </button
            >
        </div>
    </form>
</div>
