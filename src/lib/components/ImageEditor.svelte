<script lang="ts" context="module">
	const VEC2_0 = vec2.create();
	const VEC2_1 = vec2.create();
	const VEC2_2 = vec2.create();

	function renderImage(
		ctx: CanvasRenderingContext2D,
		clientWidth: number,
		clientHeight: number,
		image: HTMLImageElement,
		imageWidth: number,
		imageHeight: number,
		transform: mat2d
	) {
		ctx.save();
		ctx.clearRect(0, 0, clientWidth, clientHeight);
		ctx.translate(clientWidth * 0.5, clientHeight * 0.5);
		ctx.transform(
			transform[0],
			transform[1],
			transform[2],
			transform[3],
			transform[4],
			transform[5]
		);
		ctx.drawImage(image, -imageWidth * 0.5, -imageHeight * 0.5, imageWidth, imageHeight);
		ctx.restore();
	}
</script>

<script lang="ts">
	import type { FullGestureState } from '@use-gesture/vanilla';
	import { DragGesture } from '@use-gesture/vanilla';
	import { clickOutside } from 'svelte-use-click-outside';
	import { vec2, mat2d } from 'gl-matrix';
	import { onMount, tick } from 'svelte';
	import { composeMat2d, getAngleBetweenPoints } from '$lib/utils';

	export let src: HTMLImageElement['src'];
	export let position: vec2 = vec2.fromValues(0, 0);
	export let scale: vec2 = vec2.fromValues(1, 1);
	export let rotation: number = 0;
	export let transform: mat2d = mat2d.create();
	export let image: HTMLImageElement = typeof Image === 'undefined' ? null : new Image();
	export let canvas: HTMLCanvasElement = undefined;
	export let ctx: CanvasRenderingContext2D = undefined;

	let clientWidth: number;
	let clientHeight: number;
	let imageWidth: number;
	let imageHeight: number;
	let imageSize = vec2.create();
	$: ctx = canvas?.getContext('2d');

	let currentSrc: HTMLImageElement['src'];
	$: if (image && currentSrc !== src) {
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			const ratio = Math.min(clientWidth / image.width, clientHeight / image.height);
			imageWidth = image.width * ratio;
			imageHeight = image.height * ratio;
		};
		image.src = src;
		currentSrc = src;
	}
	$: imageSize = vec2.set(imageSize, imageWidth, imageHeight);

	let center = vec2.create();
	$: {
		center[0] = clientWidth * 0.5 - imageWidth * 0.5;
		center[1] = clientHeight * 0.5 - imageHeight * 0.5;
	}

	$: transform = composeMat2d(transform, position, scale, rotation);

	let absoluteCenter = vec2.create();
	$: if (canvas) {
		const rect = canvas.getBoundingClientRect();
		absoluteCenter = vec2.add(
			absoluteCenter,
			vec2.set(VEC2_0, rect.left + clientWidth * 0.5, rect.top + clientHeight * 0.5),
			position
		);
	}

	$: render = () => {
		if (ctx) {
			renderImage(ctx, clientWidth, clientHeight, image, imageWidth, imageHeight, transform);
		}
	};

	$: tick().then(render);

	let focused = false;
	function onFocus() {
		focused = true;
	}
	function onBlur() {
		focused = false;
	}

	function onDrag(
		state: Omit<FullGestureState<'drag'>, 'event'> & {
			event: PointerEvent | MouseEvent | TouchEvent | KeyboardEvent;
		}
	) {
		position = vec2.add(position, position, state.delta);
	}
	function createOnScale(index: number, direction: number) {
		return function onScale(
			state: Omit<FullGestureState<'drag'>, 'event'> & {
				event: PointerEvent | MouseEvent | TouchEvent | KeyboardEvent;
			}
		) {
			const delta = vec2.set(
				VEC2_1,
				(direction * state.delta[index]) / imageSize[index],
				(direction * state.delta[index]) / imageSize[index]
			);
			scale = vec2.add(scale, scale, delta);
		};
	}
	let startPosition = vec2.create();
	let startRotation = 0;
	function createOnRotate(direction: number) {
		return function onRotate(
			state: Omit<FullGestureState<'drag'>, 'event'> & {
				event: PointerEvent | MouseEvent | TouchEvent | KeyboardEvent;
			}
		) {
			if (state.first) {
				vec2.copy(startPosition, state.xy);
				startRotation = rotation;
			}
			const a = vec2.sub(VEC2_1, absoluteCenter, startPosition);
			const b = vec2.sub(VEC2_2, absoluteCenter, state.xy);
			if (direction === 1) {
				rotation = startRotation + getAngleBetweenPoints(a, b);
			} else {
				rotation = startRotation + getAngleBetweenPoints(b, a);
			}
		};
	}

	let move: HTMLElement;
	let top: HTMLElement;
	let bottom: HTMLElement;
	let left: HTMLElement;
	let right: HTMLElement;
	let topLeft: HTMLElement;
	let topRight: HTMLElement;
	let bottomLeft: HTMLElement;
	let bottomRight: HTMLElement;
	onMount(() => {
		const moveGesture = new DragGesture(move, onDrag);
		const topScaleGesture = new DragGesture(top, createOnScale(1, -1));
		const bottomScaleGesture = new DragGesture(bottom, createOnScale(1, 1));
		const leftScaleGesture = new DragGesture(left, createOnScale(0, -1));
		const rightScaleGesture = new DragGesture(right, createOnScale(0, 1));
		const topLeftRotateGesture = new DragGesture(topLeft, createOnRotate(1));
		const topRightRotateGesture = new DragGesture(topRight, createOnRotate(-1));
		const bottomLeftRotateGesture = new DragGesture(bottomLeft, createOnRotate(1));
		const bottomRightRotateGesture = new DragGesture(bottomRight, createOnRotate(-1));
		createOnRotate(1);
		return () => {
			moveGesture.destroy();
			topScaleGesture.destroy();
			bottomScaleGesture.destroy();
			leftScaleGesture.destroy();
			rightScaleGesture.destroy();
			topLeftRotateGesture.destroy();
			topRightRotateGesture.destroy();
			bottomLeftRotateGesture.destroy();
			bottomRightRotateGesture.destroy();
		};
	});
</script>

<div class="container" bind:clientWidth bind:clientHeight on:click={onFocus}>
	<canvas bind:this={canvas} width={clientWidth} height={clientHeight} />
	<div
		class="bounding-box"
		class:inactive={!focused}
		use:clickOutside={onBlur}
		style={`left:${center[0]}px;top:${center[1]}px;width:${imageWidth}px;height:${imageHeight}px;transform:matrix(${transform[0]},${transform[1]},${transform[2]},${transform[3]},${transform[4]},${transform[5]})`}
	>
		<div class="move" bind:this={move} />
		<div class="top" bind:this={top} />
		<div class="bottom" bind:this={bottom} />
		<div class="left" bind:this={left} />
		<div class="right" bind:this={right} />
		<div class="top-left" bind:this={topLeft} />
		<div class="top-right" bind:this={topRight} />
		<div class="bottom-left" bind:this={bottomLeft} />
		<div class="bottom-right" bind:this={bottomRight} />
	</div>
</div>

<style>
	.container,
	canvas {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
	}

	.bounding-box {
		position: absolute;
		transform-origin: center;
		border: 2px solid #888;
	}
	.bounding-box.inactive {
		z-index: -1;
		border: none;
	}

	.move {
		cursor: move;
		touch-action: none;
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.top,
	.bottom,
	.left,
	.right {
		position: absolute;
		touch-action: none;
	}
	.top,
	.bottom {
		cursor: ns-resize;
		left: 0;
		width: 100%;
		height: 16px;
	}
	.top {
		top: 0;
		margin-top: -8px;
	}
	.bottom {
		bottom: 0;
		margin-bottom: -8px;
	}
	.left,
	.right {
		cursor: ew-resize;
		top: 0;
		height: 100%;
		width: 16px;
	}
	.left {
		left: 0;
		margin-left: -8px;
	}
	.right {
		right: 0;
		margin-right: -8px;
	}

	.top-left,
	.top-right,
	.bottom-left,
	.bottom-right {
		cursor: grab;
		position: absolute;
		touch-action: none;
		width: 24px;
		height: 24px;
		margin-top: -12px;
		margin-left: -12px;
	}
	.top-left {
		top: 0;
		left: 0;
	}
	.top-right {
		top: 0;
		right: -12px;
	}
	.bottom-left {
		bottom: -12px;
		left: 0;
	}
	.bottom-right {
		bottom: -12px;
		right: -12px;
	}
</style>
