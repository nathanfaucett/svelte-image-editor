<script lang="ts">
	import { ImageEditor } from '$lib';

	let canvas: HTMLCanvasElement;

	$: onDownload = () =>
		window.open(canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
</script>

<div>
	<ImageEditor
		src="https://images.unsplash.com/photo-1579353977828-2a4eab540b9a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8c2FtcGxlfGVufDB8fDB8fA%3D%3D&w=1000&q=80"
		bind:canvas
	/>
</div>

<button on:click={onDownload}>Download</button>

<style>
	button {
		z-index: 1000;
	}
</style>
