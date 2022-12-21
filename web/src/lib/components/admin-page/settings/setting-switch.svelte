<script lang="ts">
	export let title: string;
	export let subtitle = '';
	export let checked = false;
	export let disabled = false;
</script>

<div class="flex justify-between mx-4 place-items-center">
	<div>
		<h2 class="immich-form-label text-sm">
			{title.toUpperCase()}
		</h2>

		<p class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
	</div>

	<label class="relative inline-block w-[36px] h-[10px]" {disabled}>
		<input
			class="opacity-0 w-0 h-0 disabled::cursor-not-allowed"
			type="checkbox"
			bind:checked
			{disabled}
		/>

		{#if disabled}
			<span class="slider-disable" />
		{:else}
			<span class="slider" />
		{/if}
	</label>
</div>

<style>
	.slider,
	.slider-disable {
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

	input:disabled {
		cursor: not-allowed;
	}

	.slider:before,
	.slider-disable:before {
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

	input:checked + .slider-disable {
		background-color: gray;
	}

	input:checked + .slider {
		background-color: #adcbfa;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(18px);
		-ms-transform: translateX(18px);
		transform: translateX(18px);
		background-color: #4250af;
	}
</style>
