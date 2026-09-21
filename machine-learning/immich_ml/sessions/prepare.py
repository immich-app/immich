import fcntl
import pickle
import sys
from pathlib import Path
from shutil import rmtree
from typing import Any

import onnx
from google.protobuf.message import DecodeError
from immich_model.runtime import apply_rewrites
from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf, NoSuchFile

from ..config import settings
from .ort import UNREADABLE, GraphSpec, Manifest, fresh


def main() -> None:
    spec: GraphSpec = pickle.loads(sys.stdin.buffer.read())
    with spec.model_path.with_suffix(".lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)  # several workers may want the same graph
        if fresh(spec) is None:
            try:
                prepare(spec)
            except (InvalidProtobuf, NoSuchFile, DecodeError):
                sys.exit(UNREADABLE)


def prepare(spec: GraphSpec) -> None:
    rmtree(spec.directory, ignore_errors=True)  # whatever is here was made under other facts, or not finished
    spec.directory.mkdir(parents=True)
    graph = rewritten(spec, spec.model_path)
    if spec.cpu_only:
        graph = prepacked(spec, graph)  # allows mmap'ing the file instead of prepacking to dirty heap memory
    elif spec.directory.as_posix() in spec.provider_options[0].values():
        spec.session(graph)  # the provider keeps what it compiles, in the directory it was given
    manifest = Manifest(facts=spec.facts, graph=graph.relative_to(spec.model_path.parent).as_posix())
    spec.manifest.write_text(manifest.model_dump_json())  # last, so that it means complete


def rewritten(spec: GraphSpec, graph: Path) -> Path:
    written: Path = graph if settings.legacy_models else apply_rewrites(graph, spec.plan)
    return written


def prepacked(spec: GraphSpec, graph: Path) -> Path:
    destination = spec.directory / "model.onnx"
    options = spec.sess_options()
    options.optimized_model_filepath = destination.as_posix()
    options.add_session_config_entry("session.optimized_model_external_initializers_file_name", "model.data")
    options.add_session_config_entry("session.save_external_prepacked_constant_initializers", "1")
    options.add_session_config_entry("session.optimized_model_external_initializers_min_size_in_bytes", "1024")
    spec.session(graph, options)
    align(destination)
    return destination


def align(destination: Path) -> None:
    """Re-lays the data file so every region starts aligned. ORT pads only large regions, so one odd length skews
    all that follow, and MLAS reads a packed weight with aligned loads: it faults, and reads the rest slower."""
    model = onnx.load(destination.as_posix(), load_external_data=False)
    length_at: dict[int, int] = {}
    offsets: list[Any] = []
    packs: list[tuple[Any, str, list[list[str]]]] = []
    for tensor in model.graph.initializer:
        fields = {entry.key: entry for entry in tensor.external_data}
        for key, entry in fields.items():
            if key == "offset":
                length_at[int(entry.value)] = int(fields["length"].value)
                offsets.append(entry)
            elif key.startswith("prepacked_"):
                blob_key, *rest = entry.value.split("|")
                triples = [item.split(";") for item in rest]
                length_at.update((int(offset), int(length)) for offset, length, _ in triples)
                packs.append((entry, blob_key, triples))

    moved, cursor = {}, 0
    for offset in sorted(length_at):
        cursor += -cursor % (4096 if length_at[offset] > 1 << 20 else 64)
        moved[offset] = cursor
        cursor += length_at[offset]

    data = destination.with_suffix(".data")
    with data.open("rb") as source, data.with_suffix(".aligned").open("wb") as target:
        for offset in sorted(length_at):
            source.seek(offset)
            target.seek(moved[offset])  # what it skips reads as zeros
            target.write(source.read(length_at[offset]))
    data.with_suffix(".aligned").replace(data)

    for entry in offsets:
        entry.value = str(moved[int(entry.value)])
    for entry, blob_key, triples in packs:
        entry.value = "|".join([blob_key, *(f"{moved[int(o)]};{n};{c}" for o, n, c in triples)])
    onnx.save(model, destination.as_posix())


if __name__ == "__main__":
    main()
