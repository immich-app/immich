<script lang="ts">
	export let title: string;
	export let subtitle = '';
	export let checked = false;
	export let color = '#2196F3';
</script>

<div class="flex justify-between mx-4 place-items-center">
	<div>
		<h2 class="immich-form-label">
			{title.toUpperCase()}
		</h2>

		<p class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
	</div>

	<label class="switch">
		<input type="checkbox" bind:checked />
		<span class="slider" />
	</label>
</div>

<style>
	.switch {
		position: relative;
		display: inline-block;
		width: 36px;
		height: 10px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 34px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 0px;
		right: 0px;
		bottom: -4px;
		background-color: gray;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #2196f3;
	}

	input:checked + .slider {
		box-shadow: 0 0 1px #2196f3;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(18px);
		-ms-transform: translateX(18px);
		transform: translateX(18px);
	}
</style>
