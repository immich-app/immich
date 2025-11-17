// RKNNLite-like minimal wrapper with correct input shape/type handling and dup_context sharing.

#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>
#include <pybind11/stl.h>

#include <cstring>
#include <cstdlib>
#include <iostream>
#include <mutex>
#include <condition_variable>
#include <stdexcept>
#include <string>
#include <vector>

#include "rknn_api.h"

#include <unistd.h>
#include <fcntl.h>

namespace py = pybind11;

// Helpers
static inline bool is_dims_known(const rknn_tensor_attr& a) {
	for (uint32_t d = 0; d < a.n_dims; ++d) {
		if ((int32_t)a.dims[d] <= 0) return false;
	}
	return true;
}

static inline py::array ensure_dtype(py::array arr, rknn_tensor_type t) {
	// Return a C-contiguous array casted to the requested dtype if needed
	if (t == RKNN_TENSOR_FLOAT16) {
		if (arr.attr("dtype").attr("name").cast<std::string>() != "float16") {
			return py::array::ensure(arr.attr("astype")(py::str("float16")), py::array::c_style);
		}
		return arr;
	}
	if (t == RKNN_TENSOR_FLOAT32) {
		if (arr.itemsize() != (ssize_t)sizeof(float)) {
			return py::array::ensure(arr.attr("astype")(py::dtype::of<float>()), py::array::c_style);
		}
		return arr;
	}
	if (t == RKNN_TENSOR_UINT8) {
		if (arr.itemsize() != (ssize_t)sizeof(uint8_t)) {
			return py::array::ensure(arr.attr("astype")(py::dtype::of<uint8_t>()), py::array::c_style);
		}
		return arr;
	}
	if (t == RKNN_TENSOR_INT8) {
		if (arr.itemsize() != (ssize_t)sizeof(int8_t)) {
			return py::array::ensure(arr.attr("astype")(py::dtype::of<int8_t>()), py::array::c_style);
		}
		return arr;
	}
	return arr;
}

struct __attribute__((visibility("hidden"))) PreparedInput {
	rknn_input tensor{};
	std::vector<uint32_t> shape;
	py::array buffer;
};

static py::list dims_to_list(const uint32_t* dims, uint32_t n_dims) {
	py::list lst;
	for (uint32_t k = 0; k < n_dims; ++k) lst.append(dims[k]);
	return lst;
}

static py::dict make_tensor_info(uint32_t index, const rknn_tensor_attr& attr) {
	py::dict d;
	d["index"] = index;
	d["name"] = py::str(attr.name);
	d["fmt"] = static_cast<int>(attr.fmt);
	d["type"] = static_cast<int>(attr.type);
	d["n_dims"] = attr.n_dims;
	d["dims"] = dims_to_list(attr.dims, attr.n_dims);
	return d;
}

static py::dict make_dynamic_dict(const rknn_input_range& rng) {
	py::dict dyn;
	dyn["shape_number"] = rng.shape_number;
	dyn["n_dims"] = rng.n_dims;
	dyn["fmt"] = static_cast<int>(rng.fmt);
	dyn["name"] = py::str(rng.name);
	py::list ranges;
	for (int s = 0; s < rng.shape_number; ++s) {
		py::list single;
		for (int d = 0; d < rng.n_dims; ++d) {
			single.append(rng.dyn_range[s][d]);
		}
		ranges.append(single);
	}
	dyn["ranges"] = ranges;
	return dyn;
}

static py::array align_layout(py::array arr, const rknn_tensor_attr& attr) {
	if (attr.n_dims != 4 || !is_dims_known(attr)) return arr;
	py::buffer_info bi = arr.request();
	if (bi.ndim != 4) return arr;
	auto matches = [&](uint32_t d1, uint32_t d2, uint32_t d3) -> bool {
		return static_cast<uint32_t>(bi.shape[1]) == d1 &&
		       static_cast<uint32_t>(bi.shape[2]) == d2 &&
		       static_cast<uint32_t>(bi.shape[3]) == d3;
	};
	auto transpose_and_ensure = [&](const py::tuple& axes) -> py::array {
		py::object transposed = arr.attr("transpose")(axes);
		py::array contiguous = py::array::ensure(transposed, py::array::c_style);
		if (!contiguous) throw std::runtime_error("Failed to transpose input tensor");
		return contiguous;
	};
	if (attr.fmt == RKNN_TENSOR_NHWC) {
		if (matches(attr.dims[1], attr.dims[2], attr.dims[3])) return arr;
		if (matches(attr.dims[3], attr.dims[1], attr.dims[2])) {
			return transpose_and_ensure(py::make_tuple(0, 2, 3, 1));
		}
	} else if (attr.fmt == RKNN_TENSOR_NCHW) {
		if (matches(attr.dims[1], attr.dims[2], attr.dims[3])) return arr;
		if (matches(attr.dims[2], attr.dims[3], attr.dims[1])) {
			return transpose_and_ensure(py::make_tuple(0, 3, 1, 2));
		}
	}
	return arr;
}

static PreparedInput prepare_input_tensor(py::handle handle, const rknn_tensor_attr& attr, bool capture_shape) {
	if (!py::isinstance<py::array>(handle)) {
		throw std::runtime_error("All inputs must be numpy arrays");
	}
	py::array arr = handle.cast<py::array>();
	py::array contiguous = py::array::ensure(arr, py::array::c_style);
	if (!contiguous) {
		throw std::runtime_error("Failed to ensure contiguous numpy array for input " + std::to_string(attr.index));
	}
	contiguous = align_layout(contiguous, attr);
	contiguous = ensure_dtype(contiguous, attr.type);
	if (!contiguous) {
		throw std::runtime_error("Failed to cast input to compiled dtype for input " + std::to_string(attr.index));
	}
	auto bi = contiguous.request();
	rknn_input tensor{};
	tensor.index = attr.index;
	tensor.type = attr.type;
	tensor.fmt = attr.fmt;
	tensor.pass_through = false;
	tensor.size = static_cast<uint32_t>(contiguous.nbytes());
	tensor.buf = const_cast<void*>(bi.ptr);

	std::vector<uint32_t> shape;
	if (capture_shape) {
		shape.reserve(static_cast<size_t>(bi.ndim));
		for (ssize_t d = 0; d < bi.ndim; ++d) {
			shape.push_back(static_cast<uint32_t>(bi.shape[d]));
		}
	}

	return {tensor, std::move(shape), contiguous};
}

static int find_matching_shape(const rknn_input_range& rng, const std::vector<uint32_t>& provided) {
	if ((int)provided.size() == rng.n_dims) {
		for (int s = 0; s < rng.shape_number; ++s) {
			bool eq = true;
			for (int d = 0; d < rng.n_dims; ++d) {
				if (static_cast<uint32_t>(rng.dyn_range[s][d]) != provided[d]) { eq = false; break; }
			}
			if (eq) return s;
		}
	}
	return rng.shape_number - 1;
}

static std::vector<ssize_t> build_output_shape(const rknn_tensor_attr& attr, size_t elems_from_rt) {
	if (attr.n_dims == 0) {
		return { static_cast<ssize_t>(elems_from_rt) };
	}
	std::vector<ssize_t> shape;
	shape.reserve(attr.n_dims);
	size_t prod = 1;
	for (uint32_t d = 0; d < attr.n_dims; ++d) {
		ssize_t dim = static_cast<ssize_t>(attr.dims[d]);
		if (dim <= 0) return { static_cast<ssize_t>(elems_from_rt) };
		shape.push_back(dim);
		prod *= static_cast<size_t>(dim);
	}
	if (prod != elems_from_rt) {
		return { static_cast<ssize_t>(elems_from_rt) };
	}
	return shape;
}

static py::array make_output_array(const rknn_tensor_attr& attr, const rknn_output& out) {
	size_t bytes_from_rt = static_cast<size_t>(out.size);
	size_t elems_from_rt = bytes_from_rt / sizeof(float);
	if (elems_from_rt == 0) elems_from_rt = 1;
	auto shape = build_output_shape(attr, elems_from_rt);
	py::array arr(py::dtype::of<float>(), shape);
	std::memcpy(arr.mutable_data(), out.buf, bytes_from_rt);
	return arr;
}

struct RknnCtx {
	rknn_context ctx = 0;
	rknn_input_output_num io_num{};
	std::vector<rknn_tensor_attr> input_attrs;
	std::vector<rknn_tensor_attr> output_attrs;

	void query_io() {
		int ret = rknn_query(ctx, RKNN_QUERY_IN_OUT_NUM, &io_num, sizeof(io_num));
		if (ret != RKNN_SUCC) throw std::runtime_error("rknn_query IN_OUT_NUM failed: " + std::to_string(ret));
		input_attrs.resize(io_num.n_input);
		output_attrs.resize(io_num.n_output);
		for (uint32_t i = 0; i < io_num.n_input; ++i) {
			auto& a = input_attrs[i];
			std::memset(&a, 0, sizeof(a));
			a.index = i;
			int ret1 = rknn_query(ctx, RKNN_QUERY_INPUT_ATTR, &a, sizeof(a));
			if (ret1 != RKNN_SUCC) throw std::runtime_error("rknn_query INPUT_ATTR failed: " + std::to_string(ret1));
		}
		for (uint32_t i = 0; i < io_num.n_output; ++i) {
			auto& a = output_attrs[i];
			std::memset(&a, 0, sizeof(a));
			a.index = i;
			int ret1 = rknn_query(ctx, RKNN_QUERY_OUTPUT_ATTR, &a, sizeof(a));
			if (ret1 != RKNN_SUCC) throw std::runtime_error("rknn_query OUTPUT_ATTR failed: " + std::to_string(ret1));
		}
	}
};

static const rknn_tensor_attr& resolve_output_attr(bool is_dynamic, RknnCtx& ctx, uint32_t index, rknn_tensor_attr& scratch) {
	if (!is_dynamic) return ctx.output_attrs[index];
	scratch.index = index;
	int qret = rknn_query(ctx.ctx, RKNN_QUERY_CURRENT_OUTPUT_ATTR, &scratch, sizeof(scratch));
	if (qret == RKNN_SUCC && scratch.n_dims > 0) {
		return scratch;
	}
	return ctx.output_attrs[index];
}

class NativeRKNNExecutor {
public:
	explicit NativeRKNNExecutor(const std::string& model_path, int num_workers)
		: rr_index_(0),
		  is_dynamic_model_(false) {
		if (num_workers < 1) throw std::invalid_argument("num_workers must be >= 1");
		if (num_workers > 3) throw std::invalid_argument("num_workers must be <= 3");
		const bool debug_ctor = (std::getenv("RKNN_EXEC_DEBUG") != nullptr);

		// master
		{
            // Initialize from model file path (per SDK: size==0 => model is filepath)
			RknnCtx master;
            int ret = rknn_init(&master.ctx, (void*)model_path.c_str(), 0, 0, nullptr);
			if (ret != RKNN_SUCC) throw std::runtime_error("rknn_init(master) failed: " + std::to_string(ret));
			master.query_io();
			if (debug_ctor) {
				std::cerr << "[RKNN2] model: inputs=" << master.io_num.n_input
				          << " outputs=" << master.io_num.n_output << std::endl;
				std::cerr << "input tensors:" << std::endl;
				for (uint32_t i = 0; i < master.io_num.n_input; ++i) {
					const auto& a = master.input_attrs[i];
					std::cerr << "  In[" << i << "] fmt=" << a.fmt << " dims=[";
					for (uint32_t d = 0; d < a.n_dims; ++d) {
						std::cerr << a.dims[d] << (d + 1 < a.n_dims ? "," : "");
					}
					std::cerr << "]" << std::endl;
				}
				std::cerr << "output tensors:" << std::endl;
				for (uint32_t i = 0; i < master.io_num.n_output; ++i) {
					const auto& a = master.output_attrs[i];
					std::cerr << "  Out[" << i << "] fmt=" << a.fmt << " dims=[";
					for (uint32_t d = 0; d < a.n_dims; ++d) {
						std::cerr << a.dims[d] << (d + 1 < a.n_dims ? "," : "");
					}
					std::cerr << "]" << std::endl;
				}
			}
			// Detect and cache dynamic input ranges (quiet to avoid SDK prints on static models)
			input_ranges_.clear();
			input_ranges_.resize(master.io_num.n_input);
			auto quiet_query_dyn = [&](uint32_t idx, rknn_input_range* out) -> int {
				int saved_stderr = dup(STDERR_FILENO);
				int devnull = open("/dev/null", O_WRONLY);
				if (devnull >= 0) { dup2(devnull, STDERR_FILENO); }
				int qret = rknn_query(master.ctx, RKNN_QUERY_INPUT_DYNAMIC_RANGE, out, sizeof(*out));
				if (saved_stderr >= 0) { dup2(saved_stderr, STDERR_FILENO); close(saved_stderr); }
				if (devnull >= 0) { close(devnull); }
				return qret;
			};
			for (uint32_t i = 0; i < master.io_num.n_input; ++i) {
				rknn_input_range rng{};
				rng.index = i;
				int qret = quiet_query_dyn(i, &rng);
				if (qret == RKNN_SUCC && rng.shape_number > 0 && rng.n_dims > 0) {
					is_dynamic_model_ = true;
					std::memcpy(&input_ranges_[i], &rng, sizeof(rng));
				} else {
					std::memset(&input_ranges_[i], 0, sizeof(input_ranges_[i]));
					input_ranges_[i].index = i;
				}
			}
			contexts_.push_back(std::move(master));
		}
		// children: duplicate context to share weights
		for (int i = 1; i < num_workers; ++i) {
			RknnCtx child;
			int ret = rknn_dup_context(&contexts_[0].ctx, &child.ctx);
			if (ret != RKNN_SUCC) throw std::runtime_error("rknn_dup_context failed: " + std::to_string(ret));
			child.query_io();
			contexts_.push_back(std::move(child));
		}
		ctx_busy_.assign(contexts_.size(), false);
	}

	~NativeRKNNExecutor() {
		for (auto& c : contexts_) {
			if (c.ctx) rknn_destroy(c.ctx);
		}
	}

	py::dict get_io_info() const {
		py::dict info;
		const RknnCtx& master = contexts_.front();
		info["is_dynamic"] = is_dynamic_model_;
		py::list inputs;
		for (uint32_t i = 0; i < master.io_num.n_input; ++i) {
			py::dict desc = make_tensor_info(i, master.input_attrs[i]);
			if (is_dynamic_model_ && i < input_ranges_.size()) {
				const auto& rng = input_ranges_[i];
				if (rng.shape_number > 0 && rng.n_dims > 0) {
					desc["dynamic"] = make_dynamic_dict(rng);
				}
			}
			inputs.append(desc);
		}
		info["inputs"] = inputs;
		py::list outputs;
		for (uint32_t i = 0; i < master.io_num.n_output; ++i) {
			outputs.append(make_tensor_info(i, master.output_attrs[i]));
		}
		info["outputs"] = outputs;
		return info;
	}

	py::list infer(const py::list& inputs) {
		auto ctx_handle = acquire_ctx_();
		auto& c = ctx_handle.ctx;
		if (inputs.size() != c.io_num.n_input) {
			throw std::runtime_error("Input count mismatch. Expected " + std::to_string(c.io_num.n_input) +
			                         ", got " + std::to_string(inputs.size()));
		}
		std::vector<rknn_input> in(c.io_num.n_input);
		std::vector<py::array> keep_alive;
		keep_alive.reserve(c.io_num.n_input);
		const bool need_shapes = is_dynamic_model_;
		std::vector<std::vector<uint32_t>> input_shapes;
		if (need_shapes) input_shapes.reserve(c.io_num.n_input);
		for (uint32_t i = 0; i < c.io_num.n_input; ++i) {
			PreparedInput prepared = prepare_input_tensor(inputs[i], c.input_attrs[i], need_shapes);
			in[i] = prepared.tensor;
			if (need_shapes) input_shapes.push_back(std::move(prepared.shape));
			keep_alive.push_back(std::move(prepared.buffer));
		}

		if (need_shapes) {
			maybe_set_dynamic_shapes(c, input_shapes);
		}

		// Run
		std::vector<rknn_output> out(c.io_num.n_output);
		{
			py::gil_scoped_release nogil;
			int ret = rknn_inputs_set(c.ctx, c.io_num.n_input, in.data());
			if (ret != RKNN_SUCC) throw std::runtime_error("rknn_inputs_set failed: " + std::to_string(ret));
			ret = rknn_run(c.ctx, nullptr);
			if (ret != RKNN_SUCC) throw std::runtime_error("rknn_run failed: " + std::to_string(ret));
			for (uint32_t i = 0; i < c.io_num.n_output; ++i) {
				std::memset(&out[i], 0, sizeof(rknn_output));
				out[i].want_float = 1; // return float32
				out[i].index = i;
			}
			ret = rknn_outputs_get(c.ctx, c.io_num.n_output, out.data(), nullptr);
			if (ret != RKNN_SUCC) throw std::runtime_error("rknn_outputs_get failed: " + std::to_string(ret));
		}

		// Build numpy outputs
		py::list result;
		for (uint32_t i = 0; i < c.io_num.n_output; ++i) {
			rknn_tensor_attr scratch{};
			const auto& attr = resolve_output_attr(is_dynamic_model_, c, i, scratch);
			result.append(make_output_array(attr, out[i]));
		}
		{
			py::gil_scoped_release nogil;
			int rret = rknn_outputs_release(c.ctx, c.io_num.n_output, out.data());
			(void)rret;
		}
		return result;
	}

private:
	struct CtxHandle {
		RknnCtx& ctx;
		NativeRKNNExecutor& owner;
		size_t index;
		CtxHandle(RknnCtx& ctx_ref, NativeRKNNExecutor& parent, size_t idx)
			: ctx(ctx_ref), owner(parent), index(idx) {}
		~CtxHandle() {
			owner.release_ctx_(index);
		}
	};

	CtxHandle acquire_ctx_() {
		std::unique_lock<std::mutex> lock(ctx_mutex_);
		ctx_cv_.wait(lock, [&]{
			for (bool busy : ctx_busy_) {
				if (!busy) return true;
			}
			return false;
		});
		size_t start = rr_index_;
		for (size_t attempt = 0; attempt < ctx_busy_.size(); ++attempt) {
			size_t idx = (start + attempt) % ctx_busy_.size();
			if (!ctx_busy_[idx]) {
				ctx_busy_[idx] = true;
				rr_index_ = (idx + 1) % ctx_busy_.size();
				return CtxHandle(contexts_[idx], *this, idx);
			}
		}
		throw std::runtime_error("No RKNN context available");
	}

	void release_ctx_(size_t idx) {
		std::lock_guard<std::mutex> lock(ctx_mutex_);
		ctx_busy_[idx] = false;
		ctx_cv_.notify_one();
	}
	void maybe_set_dynamic_shapes(RknnCtx& ctx, const std::vector<std::vector<uint32_t>>& input_shapes) const;

private:
	std::mutex ctx_mutex_;
	std::condition_variable ctx_cv_;
	size_t rr_index_;
	std::vector<RknnCtx> contexts_;
	std::vector<bool> ctx_busy_;
	bool is_dynamic_model_;
	std::vector<rknn_input_range> input_ranges_;
};

void NativeRKNNExecutor::maybe_set_dynamic_shapes(RknnCtx& ctx, const std::vector<std::vector<uint32_t>>& input_shapes) const {
	if (!is_dynamic_model_ || ctx.io_num.n_input == 0) return;
	std::vector<rknn_tensor_attr> attrs;
	bool needs_set = false;
	for (uint32_t i = 0; i < ctx.io_num.n_input; ++i) {
		if (i >= input_ranges_.size() || i >= input_shapes.size()) continue;
		const auto& rng = input_ranges_[i];
		if (rng.shape_number <= 0 || rng.n_dims <= 0) continue;
		int match_idx = find_matching_shape(rng, input_shapes[i]);
		if (!needs_set) {
			attrs = ctx.input_attrs;
			needs_set = true;
		}
		auto& attr = attrs[i];
		attr.n_dims = static_cast<uint32_t>(rng.n_dims);
		for (int d = 0; d < rng.n_dims && d < (int)RKNN_MAX_DIMS; ++d) {
			attr.dims[d] = static_cast<uint32_t>(rng.dyn_range[match_idx][d]);
		}
		if (rng.fmt == RKNN_TENSOR_NHWC || rng.fmt == RKNN_TENSOR_NCHW || rng.fmt == RKNN_TENSOR_UNDEFINED) {
			attr.fmt = rng.fmt;
		}
		attr.type = ctx.input_attrs[i].type;
	}
	if (!needs_set) return;
	int sret = rknn_set_input_shapes(ctx.ctx, ctx.io_num.n_input, attrs.data());
	if (sret != RKNN_SUCC) {
		throw std::runtime_error("Failed to set input shapes for dynamic-list model.");
	}
}

PYBIND11_MODULE(rknn_pool, m) {
	py::class_<NativeRKNNExecutor>(m, "NativeRKNNExecutor")
		.def(py::init<const std::string&, int>(), py::arg("model_path"), py::arg("num_workers") = 1)
		.def("set_core_mask_all",
		     [](NativeRKNNExecutor& /*self*/, int /*mask*/) {
			     // Placeholder for API compatibility; no-op.
		     },
		     py::arg("mask"),
		     "Set the NPU core mask for all contexts (no-op placeholder).")
		.def("infer", &NativeRKNNExecutor::infer, py::arg("inputs"),
		     "Run inference with a list of numpy arrays, returns list of numpy arrays.")
		.def("get_io_info", &NativeRKNNExecutor::get_io_info,
		     "Return a dict with model IO info, including dynamic input ranges when available.");
}


