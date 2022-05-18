<script lang="ts">
	import { session } from '$app/stores';

	import { serverEndpoint } from '../../constants';

	const createNewUser = async () => {
		const res = await fetch(`${serverEndpoint}/user`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${$session.user?.accessToken}`,
			},
		});

		const a = await res.json();

		console.log('Create new user ', a);
	};
</script>

<p class="text-sm">USER LIST</p>

<button on:click={createNewUser}>Create user</button>
<table class="text-left w-full mt-4">
	<thead class="border rounded-tl-md rounded-tr-md bg-gray-100 flex text-immich-primary w-full h-12 ">
		<tr class="flex w-full place-items-center ">
			<th class="text-center w-1/4 font-medium">Email</th>
			<th class="text-center w-1/4 font-medium">First name</th>
			<th class="text-center w-1/4 font-medium">Last name</th>
			<th class="text-center w-1/4 font-medium">Edit</th>
		</tr>
	</thead>
	<!-- Remove the nasty inline CSS fixed height on production and replace it with a CSS class — this is just for demonstration purposes! -->
	<tbody
		class="bg-grey-light flex flex-col items-center justify-between overflow-y-scroll w-full"
		style="height: 50vh;"
	>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
		<tr class="flex w-full mb-4">
			<td class="p-4 w-1/4">Dogs</td>
			<td class="p-4 w-1/4">Cats</td>
			<td class="p-4 w-1/4">Birds</td>
			<td class="p-4 w-1/4">Fish</td>
		</tr>
	</tbody>
</table>
