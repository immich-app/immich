import argparse
from pathlib import Path
from typing import List

import numpy as np
import time

try:
	from .immich_session import RknnSession
except ImportError:
	from rknn_multi_executor.immich_session import RknnSession  # type: ignore


def parse_shape(shape_str: str) -> List[int]:
	parts = [p.strip() for p in shape_str.split(",") if p.strip()]
	if not parts:
		raise ValueError("Invalid shape string")
	return [int(p) for p in parts]

def main() -> None:
	parser = argparse.ArgumentParser(description="Minimal RKNN Native Executor usage")
	parser.add_argument("--model", required=True, type=Path, help="Path to .rknn model")
	parser.add_argument("--num-workers", type=int, default=3, help="Number of worker contexts")
	parser.add_argument(
		"--shape",
		type=str,
		default="1,3,640,640",
		help="Input shape as comma-separated list, e.g. 1,3,640,640",
	)
	parser.add_argument(
		"--dtype",
		type=str,
		default="float32",
		choices=["float32", "float16", "int32", "int8", "uint8"],
		help="Data type for randomly generated input tensor",
	)
	args = parser.parse_args()

	shape = parse_shape(args.shape)
	if len(shape) < 2:
		raise ValueError("Shape must have at least 2 dims (e.g., NCHW)")

	gen_t0 = time.perf_counter()
	# Generate a random input tensor with the requested dtype
	if args.dtype == "float32":
		x = np.random.rand(*shape).astype(np.float32)
	elif args.dtype == "float16":
		x = np.random.rand(*shape).astype(np.float16)
	elif args.dtype == "int32":
		# Use a modest integer range; adjust as needed for your model (e.g., vocab size)
		x = np.random.randint(0, 1000, size=tuple(shape), dtype=np.int32)
	elif args.dtype == "int8":
		x = np.random.randint(-128, 128, size=tuple(shape), dtype=np.int8)
	elif args.dtype == "uint8":
		x = np.random.randint(0, 256, size=tuple(shape), dtype=np.uint8)
	else:
		raise ValueError(f"Unsupported dtype: {args.dtype}")
	gen_t1 = time.perf_counter()
	print(
		f"[timing] generated random {args.dtype} tensor with shape {shape} "
		f"in {(gen_t1-gen_t0)*1000:.2f} ms"
	)

	time.sleep(1)
	session_t0 = time.perf_counter()
	session = RknnSession(args.model.as_posix(), num_workers=args.num_workers)
	session_t1 = time.perf_counter()
	print(f"[timing] session init took {(session_t1-session_t0)*1000:.2f} ms")
	try:
		print("IO description:", session.io_info)
		inputs = session.get_inputs()
		if not inputs:
			raise RuntimeError("Model exposes no inputs")
		input_name = inputs[0].name or "input"

		# Serial demo
		for i in range(3):
			t0 = time.perf_counter()
			outs = session.run(None, {input_name: x})
			t1 = time.perf_counter()
			print(
				f"[serial {i+1}] start={t0:.6f}s end={t1:.6f}s "
				f"dur_ms={(t1-t0)*1000:.2f} shapes={[getattr(o, 'shape', None) for o in outs]}"
			)
		time.sleep(1)
		# Parallel demo using Immich-style pool
		total_requests = 5 * args.num_workers
		print(f"[pool] submitting {total_requests} requests with {args.num_workers} worker contexts")
		batch_t0 = time.perf_counter()
		for _ in range(total_requests):
			session.rknnpool.put([x])
		for idx in range(total_requests):
			res = session.rknnpool.get(raw=True)
			if res is None:
				raise RuntimeError("Pool returned no outputs")
			outs = res.outputs
			lat_ms = res.duration_s * 1000.0
			print(f"[parallel {idx+1}] dur_ms={lat_ms:.2f} shapes={[getattr(o, 'shape', None) for o in outs]}")
		batch_t1 = time.perf_counter()
		print(f"[parallel batch] total_ms={(batch_t1-batch_t0)*1000:.2f}")
	finally:
		session.close()


if __name__ == "__main__":
	main()


