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

namespace py = pybind11;
using namespace py::literals;

// Helpers
static bool is_dims_known(const rknn_tensor_attr& a) {
	for (uint32_t d = 0; d < a.n_dims; ++d) {
		if (a.dims[d] == 0) return false;
	}
	return true;
}

static py::array ensure_dtype(py::array arr, rknn_tensor_type t) {
	py::dtype target_dtype;
	switch (t) {
		case RKNN_TENSOR_FLOAT16:
			target_dtype = py::dtype("float16");
			break;
		case RKNN_TENSOR_FLOAT32:
			target_dtype = py::dtype::of<float>();
			break;
		case RKNN_TENSOR_UINT8:
			target_dtype = py::dtype::of<uint8_t>();
			break;
		case RKNN_TENSOR_INT8:
			target_dtype = py::dtype::of<int8_t>();
			break;
		default:
			return arr;
	}
	if (!arr.dtype().is(target_dtype)) {
		return py::array::ensure(arr.attr("astype")(target_dtype), py::array::c_style);
	}
	return arr;
}

struct __attribute__((visibility("hidden"))) PreparedInput {
	rknn_input tensor{};
	std::vector<uint32_t> shape;
	py::array buffer;
};

static py::list dims_to_list(const uint32_t* dims, uint32_t n_dims) {
	py::list lst(n_dims);
	for (uint32_t k = 0; k < n_dims; ++k) lst[k] = dims[k];
	return lst;
}

static py::dict make_tensor_info(uint32_t index, const rknn_tensor_attr& attr) {
	return py::dict("index"_a=index, "name"_a=py::str(attr.name), "fmt"_a=static_cast<int>(attr.fmt),
	                "type"_a=static_cast<int>(attr.type), "n_dims"_a=attr.n_dims,
	                "dims"_a=dims_to_list(attr.dims, attr.n_dims));
}

static py::dict make_dynamic_dict(const rknn_input_range& rng) {
	py::list ranges(rng.shape_number);
	for (uint32_t s = 0; s < rng.shape_number; ++s) {
		py::list single(rng.n_dims);
		for (uint32_t d = 0; d < rng.n_dims; ++d) {
			single[d] = rng.dyn_range[s][d];
		}
		ranges[s] = single;
	}
	return py::dict("shape_number"_a=rng.shape_number, "n_dims"_a=rng.n_dims,
	                "fmt"_a=static_cast<int>(rng.fmt), "name"_a=py::str(rng.name), "ranges"_a=ranges);
}

static py::array align_layout(py::array arr, const rknn_tensor_attr& attr) {
	if (attr.n_dims != 4 || !is_dims_known(attr)) return arr;
	py::buffer_info bi = arr.request();
	if (bi.ndim != 4) return arr;
	
	auto matches = [&](uint32_t d1, uint32_t d2, uint32_t d3) -> bool {
		return bi.shape[1] == d1 && bi.shape[2] == d2 && bi.shape[3] == d3;
	};
	
	if (attr.fmt == RKNN_TENSOR_NHWC) {
		if (matches(attr.dims[1], attr.dims[2], attr.dims[3])) return arr;
		if (matches(attr.dims[3], attr.dims[1], attr.dims[2])) {
			return py::array::ensure(arr.attr("transpose")(py::make_tuple(0, 2, 3, 1)), py::array::c_style);
		}
	} else if (attr.fmt == RKNN_TENSOR_NCHW) {
		if (matches(attr.dims[1], attr.dims[2], attr.dims[3])) return arr;
		if (matches(attr.dims[2], attr.dims[3], attr.dims[1])) {
			return py::array::ensure(arr.attr("transpose")(py::make_tuple(0, 3, 1, 2)), py::array::c_style);
		}
	}
	return arr;
}

static PreparedInput prepare_input_tensor(py::handle handle, const rknn_tensor_attr& attr, bool capture_shape) {
	py::array arr = handle.cast<py::array>();
	py::array contiguous = py::array::ensure(arr, py::array::c_style);
	contiguous = align_layout(contiguous, attr);
	contiguous = ensure_dtype(contiguous, attr.type);
	auto bi = contiguous.request();
	
	rknn_input tensor{};
	tensor.index = attr.index;
	tensor.type = attr.type;
	tensor.fmt = attr.fmt;
	tensor.size = static_cast<uint32_t>(contiguous.nbytes());
	tensor.buf = const_cast<void*>(bi.ptr);

	std::vector<uint32_t> shape;
	if (capture_shape) {
		shape.resize(bi.ndim);
		for (ssize_t d = 0; d < bi.ndim; ++d) {
			shape[d] = static_cast<uint32_t>(bi.shape[d]);
		}
	}
	return {tensor, std::move(shape), contiguous};
}

static int find_matching_shape(const rknn_input_range& rng, const std::vector<uint32_t>& provided) {
	if (provided.size() != rng.n_dims) return rng.shape_number - 1;
	for (uint32_t s = 0; s < rng.shape_number; ++s) {
		bool match = true;
		for (uint32_t d = 0; d < rng.n_dims && match; ++d)
			match = (rng.dyn_range[s][d] == provided[d]);
		if (match) return s;
	}
	return rng.shape_number - 1;
}

static py::array make_output_array(const rknn_tensor_attr& attr, const rknn_output& out) {
	std::vector<ssize_t> shape(attr.n_dims == 0 ? 1 : attr.n_dims);
	if (attr.n_dims == 0) {
		shape[0] = static_cast<ssize_t>(out.size / sizeof(float));
	} else {
		std::copy(attr.dims, attr.dims + attr.n_dims, shape.begin());
	}
	py::array arr(py::dtype::of<float>(), shape);
	std::memcpy(arr.mutable_data(), out.buf, out.size);
	return arr;
}


struct RknnCtx {
	rknn_context ctx = 0;
	rknn_input_output_num io_num{};
	std::vector<rknn_tensor_attr> input_attrs;
	std::vector<rknn_tensor_attr> output_attrs;

	void query_io() {
		if (rknn_query(ctx, RKNN_QUERY_IN_OUT_NUM, &io_num, sizeof(io_num)) != RKNN_SUCC)
			throw std::runtime_error("rknn_query IN_OUT_NUM failed");
		input_attrs.resize(io_num.n_input);
		output_attrs.resize(io_num.n_output);
		for (uint32_t i = 0; i < io_num.n_input; ++i) {
			rknn_tensor_attr attr{};
			attr.index = i;
			if (rknn_query(ctx, RKNN_QUERY_INPUT_ATTR, &attr, sizeof(attr)) != RKNN_SUCC)
				throw std::runtime_error("rknn_query INPUT_ATTR failed");
			input_attrs[i] = attr;
		}
		for (uint32_t i = 0; i < io_num.n_output; ++i) {
			rknn_tensor_attr attr{};
			attr.index = i;
			if (rknn_query(ctx, RKNN_QUERY_OUTPUT_ATTR, &attr, sizeof(attr)) != RKNN_SUCC)
				throw std::runtime_error("rknn_query OUTPUT_ATTR failed");
			output_attrs[i] = attr;
		}
	}
};

static void debug_print_io_info(const RknnCtx& ctx) {
	std::cerr << "[rknn2] model: inputs=" << ctx.io_num.n_input
	          << " outputs=" << ctx.io_num.n_output << std::endl;
	std::cerr << "input tensors:" << std::endl;
	for (uint32_t i = 0; i < ctx.io_num.n_input; ++i) {
		const auto& a = ctx.input_attrs[i];
		std::cerr << "  in[" << i << "] fmt=" << a.fmt << " dims=[";
		for (uint32_t d = 0; d < a.n_dims; ++d) {
			std::cerr << a.dims[d] << (d + 1 < a.n_dims ? "," : "");
		}
		std::cerr << "]" << std::endl;
	}
	std::cerr << "output tensors:" << std::endl;
	for (uint32_t i = 0; i < ctx.io_num.n_output; ++i) {
		const auto& a = ctx.output_attrs[i];
		std::cerr << "  out[" << i << "] fmt=" << a.fmt << " dims=[";
		for (uint32_t d = 0; d < a.n_dims; ++d) {
			std::cerr << a.dims[d] << (d + 1 < a.n_dims ? "," : "");
		}
		std::cerr << "]" << std::endl;
	}
}

static const rknn_tensor_attr& resolve_output_attr(bool is_dynamic, RknnCtx& ctx, uint32_t index, rknn_tensor_attr& scratch) {
	if (!is_dynamic) return ctx.output_attrs[index];
	scratch.index = index;
	if (rknn_query(ctx.ctx, RKNN_QUERY_CURRENT_OUTPUT_ATTR, &scratch, sizeof(scratch)) == RKNN_SUCC) {
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

		RknnCtx master;
		if (rknn_init(&master.ctx, const_cast<char*>(model_path.c_str()), 0, 0, nullptr) != RKNN_SUCC)
			throw std::runtime_error("rknn_init failed");
		master.query_io();
		if (debug_ctor) debug_print_io_info(master);
		
		input_ranges_.resize(master.io_num.n_input);
		for (uint32_t i = 0; i < master.io_num.n_input; ++i) {
			rknn_input_range rng{};
			rng.index = i;
			if (rknn_query(master.ctx, RKNN_QUERY_INPUT_DYNAMIC_RANGE, &rng, sizeof(rng)) == RKNN_SUCC
			    && rng.shape_number > 0 && rng.n_dims > 0) {
				is_dynamic_model_ = true;
				input_ranges_[i] = rng;
			}
		}
		contexts_.push_back(std::move(master));
		
		for (int i = 1; i < num_workers; ++i) {
			RknnCtx child;
			if (rknn_dup_context(&contexts_[0].ctx, &child.ctx) != RKNN_SUCC)
				throw std::runtime_error("rknn_dup_context failed");
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
		py::list inputs(master.io_num.n_input);
		for (uint32_t i = 0; i < master.io_num.n_input; ++i) {
			py::dict desc = make_tensor_info(i, master.input_attrs[i]);
			if (is_dynamic_model_ && i < input_ranges_.size()) {
				const auto& rng = input_ranges_[i];
				if (rng.shape_number > 0 && rng.n_dims > 0) {
					desc["dynamic"] = make_dynamic_dict(rng);
				}
			}
			inputs[i] = desc;
		}
		info["inputs"] = inputs;
		py::list outputs(master.io_num.n_output);
		for (uint32_t i = 0; i < master.io_num.n_output; ++i) {
			outputs[i] = make_tensor_info(i, master.output_attrs[i]);
		}
		info["outputs"] = outputs;
		return info;
	}

	py::list infer(const py::list& inputs) {
		auto ctx_handle = acquire_ctx_();
		auto& c = ctx_handle.ctx;
		if (inputs.size() != c.io_num.n_input)
			throw std::runtime_error("Input count mismatch");
		
		std::vector<rknn_input> in(c.io_num.n_input);
		std::vector<py::array> keep_alive;
		keep_alive.reserve(c.io_num.n_input);
		std::vector<std::vector<uint32_t>> input_shapes;
		if (is_dynamic_model_) input_shapes.reserve(c.io_num.n_input);
		
		for (uint32_t i = 0; i < c.io_num.n_input; ++i) {
			PreparedInput prepared = prepare_input_tensor(inputs[i], c.input_attrs[i], is_dynamic_model_);
			in[i] = prepared.tensor;
			if (is_dynamic_model_) input_shapes.push_back(std::move(prepared.shape));
			keep_alive.push_back(std::move(prepared.buffer));
		}
		if (is_dynamic_model_) set_dynamic_shapes(c, input_shapes);

		std::vector<rknn_output> out(c.io_num.n_output);
		{
			py::gil_scoped_release nogil;
			if (rknn_inputs_set(c.ctx, c.io_num.n_input, in.data()) != RKNN_SUCC)
				throw std::runtime_error("rknn_inputs_set failed");
			if (rknn_run(c.ctx, nullptr) != RKNN_SUCC)
				throw std::runtime_error("rknn_run failed");
			for (uint32_t i = 0; i < c.io_num.n_output; ++i) {
				out[i] = {};
				out[i].want_float = 1;
				out[i].index = i;
			}
			if (rknn_outputs_get(c.ctx, c.io_num.n_output, out.data(), nullptr) != RKNN_SUCC)
				throw std::runtime_error("rknn_outputs_get failed");
		}

		py::list result(c.io_num.n_output);
		rknn_tensor_attr scratch{};
		for (uint32_t i = 0; i < c.io_num.n_output; ++i) {
			const auto& attr = resolve_output_attr(is_dynamic_model_, c, i, scratch);
			result[i] = make_output_array(attr, out[i]);
		}
		{
			py::gil_scoped_release nogil;
			rknn_outputs_release(c.ctx, c.io_num.n_output, out.data());
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
	void set_dynamic_shapes(RknnCtx& ctx, const std::vector<std::vector<uint32_t>>& input_shapes) const;

private:
	std::mutex ctx_mutex_;
	std::condition_variable ctx_cv_;
	size_t rr_index_;
	std::vector<RknnCtx> contexts_;
	std::vector<bool> ctx_busy_;
	bool is_dynamic_model_;
	std::vector<rknn_input_range> input_ranges_;
};

void NativeRKNNExecutor::set_dynamic_shapes(RknnCtx& ctx, const std::vector<std::vector<uint32_t>>& input_shapes) const {
	std::vector<rknn_tensor_attr> attrs = ctx.input_attrs;
	for (uint32_t i = 0; i < ctx.io_num.n_input && i < input_ranges_.size() && i < input_shapes.size(); ++i) {
		const auto& rng = input_ranges_[i];
		if (rng.shape_number == 0 || rng.n_dims == 0) continue;
		int match_idx = find_matching_shape(rng, input_shapes[i]);
		auto& attr = attrs[i];
		attr.n_dims = rng.n_dims;
		for (uint32_t d = 0; d < rng.n_dims && d < RKNN_MAX_DIMS; ++d) {
			attr.dims[d] = rng.dyn_range[match_idx][d];
		}
		if (rng.fmt == RKNN_TENSOR_NHWC || rng.fmt == RKNN_TENSOR_NCHW || rng.fmt == RKNN_TENSOR_UNDEFINED)
			attr.fmt = rng.fmt;
		attr.type = ctx.input_attrs[i].type;
	}
	if (rknn_set_input_shapes(ctx.ctx, ctx.io_num.n_input, attrs.data()) != RKNN_SUCC)
		throw std::runtime_error("Failed to set input shapes for dynamic model");
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


