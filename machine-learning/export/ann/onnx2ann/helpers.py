from typing import Any


def onnx_make_armnn_compatible(model_path: str) -> None:
    """
    i can explain
    armnn only supports up to 4d tranposes, but the model has a 5d transpose due to a redundant unsqueeze
    this function folds the unsqueeze+transpose+squeeze into a single 4d transpose
    it also switches from gather ops to slices since armnn has different dimension semantics for gathers
    also fixes batch normalization being in training mode
    """

    import numpy as np
    import onnx
    from onnx_graphsurgeon import Constant, Node, Variable, export_onnx, import_onnx

    proto = onnx.load(model_path)
    graph = import_onnx(proto)

    gather_idx = 1
    squeeze_idx = 1
    for node in graph.nodes:
        for link1 in node.outputs:
            if "Unsqueeze" in link1.name:
                for node1 in link1.outputs:
                    for link2 in node1.outputs:
                        if "Transpose" in link2.name:
                            for node2 in link2.outputs:
                                if node2.attrs.get("perm") == [3, 1, 2, 0, 4]:
                                    node2.attrs["perm"] = [2, 0, 1, 3]
                                    link2.shape = link1.shape
                                    for link3 in node2.outputs:
                                        if "Squeeze" in link3.name:
                                            link3.shape = [link3.shape[x] for x in [0, 1, 2, 4]]
                                            for node3 in link3.outputs:
                                                for link4 in node3.outputs:
                                                    link4.shape = link3.shape
                                                    try:
                                                        idx = link2.inputs.index(node1)
                                                        link2.inputs[idx] = node
                                                    except ValueError:
                                                        pass

                                                    node.outputs = [link2]
                                                    if "Gather" in link4.name:
                                                        for node4 in link4.outputs:
                                                            axis = node1.attrs.get("axis", 0)
                                                            index = node4.inputs[1].values
                                                            slice_link = Variable(
                                                                f"onnx::Slice_123{gather_idx}",
                                                                dtype=link4.dtype,
                                                                shape=[1] + link3.shape[1:],
                                                            )
                                                            slice_node = Node(
                                                                op="Slice",
                                                                inputs=[
                                                                    link3,
                                                                    Constant(
                                                                        f"SliceStart_123{gather_idx}",
                                                                        np.array([index]),
                                                                    ),
                                                                    Constant(
                                                                        f"SliceEnd_123{gather_idx}",
                                                                        np.array([index + 1]),
                                                                    ),
                                                                    Constant(
                                                                        f"SliceAxis_123{gather_idx}",
                                                                        np.array([axis]),
                                                                    ),
                                                                ],
                                                                outputs=[slice_link],
                                                                name=f"Slice_123{gather_idx}",
                                                            )
                                                            graph.nodes.append(slice_node)
                                                            gather_idx += 1

                                                            for link5 in node4.outputs:
                                                                for node5 in link5.outputs:
                                                                    try:
                                                                        idx = node5.inputs.index(link5)
                                                                        node5.inputs[idx] = slice_link
                                                                    except ValueError:
                                                                        pass
            elif node.op == "LayerNormalization":
                for node1 in link1.outputs:
                    if node1.op == "Gather":
                        for link2 in node1.outputs:
                            for node2 in link2.outputs:
                                axis = node1.attrs.get("axis", 0)
                                index = node1.inputs[1].values
                                slice_link = Variable(
                                    f"onnx::Slice_123{gather_idx}",
                                    dtype=link2.dtype,
                                    shape=[1, *link2.shape],
                                )
                                slice_node = Node(
                                    op="Slice",
                                    inputs=[
                                        node1.inputs[0],
                                        Constant(
                                            f"SliceStart_123{gather_idx}",
                                            np.array([index]),
                                        ),
                                        Constant(
                                            f"SliceEnd_123{gather_idx}",
                                            np.array([index + 1]),
                                        ),
                                        Constant(
                                            f"SliceAxis_123{gather_idx}",
                                            np.array([axis]),
                                        ),
                                    ],
                                    outputs=[slice_link],
                                    name=f"Slice_123{gather_idx}",
                                )
                                graph.nodes.append(slice_node)
                                gather_idx += 1

                                squeeze_link = Variable(
                                    f"onnx::Squeeze_123{squeeze_idx}",
                                    dtype=link2.dtype,
                                    shape=link2.shape,
                                )
                                squeeze_node = Node(
                                    op="Squeeze",
                                    inputs=[
                                        slice_link,
                                        Constant(
                                            f"SqueezeAxis_123{squeeze_idx}",
                                            np.array([0]),
                                        ),
                                    ],
                                    outputs=[squeeze_link],
                                    name=f"Squeeze_123{squeeze_idx}",
                                )
                                graph.nodes.append(squeeze_node)
                                squeeze_idx += 1
                                try:
                                    idx = node2.inputs.index(link2)
                                    node2.inputs[idx] = squeeze_link
                                except ValueError:
                                    pass
            elif node.op == "Reshape":
                for node1 in link1.outputs:
                    if node1.op == "Gather":
                        node2s = [n for link in node1.outputs for n in link.outputs]
                        if any(n.op == "Abs" for n in node2s):
                            axis = node1.attrs.get("axis", 0)
                            index = node1.inputs[1].values
                            slice_link = Variable(
                                f"onnx::Slice_123{gather_idx}",
                                dtype=node1.outputs[0].dtype,
                                shape=[1, *node1.outputs[0].shape],
                            )
                            slice_node = Node(
                                op="Slice",
                                inputs=[
                                    node1.inputs[0],
                                    Constant(
                                        f"SliceStart_123{gather_idx}",
                                        np.array([index]),
                                    ),
                                    Constant(
                                        f"SliceEnd_123{gather_idx}",
                                        np.array([index + 1]),
                                    ),
                                    Constant(
                                        f"SliceAxis_123{gather_idx}",
                                        np.array([axis]),
                                    ),
                                ],
                                outputs=[slice_link],
                                name=f"Slice_123{gather_idx}",
                            )
                            graph.nodes.append(slice_node)
                            gather_idx += 1

                            squeeze_link = Variable(
                                f"onnx::Squeeze_123{squeeze_idx}",
                                dtype=node1.outputs[0].dtype,
                                shape=node1.outputs[0].shape,
                            )
                            squeeze_node = Node(
                                op="Squeeze",
                                inputs=[
                                    slice_link,
                                    Constant(
                                        f"SqueezeAxis_123{squeeze_idx}",
                                        np.array([0]),
                                    ),
                                ],
                                outputs=[squeeze_link],
                                name=f"Squeeze_123{squeeze_idx}",
                            )
                            graph.nodes.append(squeeze_node)
                            squeeze_idx += 1
                            for node2 in node2s:
                                node2.inputs[0] = squeeze_link
            elif node.op == "BatchNormalization" and node.attrs.get("training_mode") == 1:
                node.attrs["training_mode"] = 0
                node.outputs = node.outputs[:1]

    graph.cleanup(remove_unused_node_outputs=True, recurse_subgraphs=True, recurse_functions=True)
    graph.toposort()
    graph.fold_constants()
    updated = export_onnx(graph)
    onnx_save(updated, model_path)

    # for some reason, reloading the model is necessary to apply the correct shape
    proto = onnx.load(model_path)
    graph = import_onnx(proto)
    for node in graph.nodes:
        if node.op == "Slice":
            for link in node.outputs:
                if "Slice_123" in link.name and link.shape[0] == 3:  # noqa: PLR2004
                    link.shape[0] = 1

    graph.cleanup(remove_unused_node_outputs=True, recurse_subgraphs=True, recurse_functions=True)
    graph.toposort()
    graph.fold_constants()
    updated = export_onnx(graph)
    onnx_save(updated, model_path)
    onnx.shape_inference.infer_shapes_path(model_path, check_type=True, strict_mode=True, data_prop=True)


def onnx_make_inputs_fixed(input_path: str, output_path: str, input_shapes: list[tuple[int, ...]]) -> None:
    import onnx
    import onnxsim
    from onnxruntime.tools.onnx_model_utils import fix_output_shapes, make_input_shape_fixed

    model, success = onnxsim.simplify(input_path)
    if not success:
        msg = f"Failed to simplify {input_path}"
        raise RuntimeError(msg)
    onnx_save(model, output_path)
    onnx.shape_inference.infer_shapes_path(output_path, check_type=True, strict_mode=True, data_prop=True)
    model = onnx.load_model(output_path)
    for input_node, shape in zip(model.graph.input, input_shapes, strict=False):
        make_input_shape_fixed(model.graph, input_node.name, shape)
    fix_output_shapes(model)
    onnx_save(model, output_path)
    onnx.shape_inference.infer_shapes_path(output_path, check_type=True, strict_mode=True, data_prop=True)


def onnx_get_inputs_outputs(model_path: str) -> tuple[list[str], list[str]]:
    import onnx

    model = onnx.load(model_path)
    inputs = [input_.name for input_ in model.graph.input]
    outputs = [output_.name for output_ in model.graph.output]
    return inputs, outputs


def onnx_save(model: Any, output_path: str) -> None:
    import onnx

    try:
        onnx.save(model, output_path)
    except:
        onnx.save(model, output_path, save_as_external_data=True, all_tensors_to_one_file=False, size_threshold=1_000_000)