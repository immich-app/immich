// Refuses cuDNN execution plans for the engines in BLOCKED_CUDNN_ENGINES (global indices, comma separated): the plan
// fails to build, so cudnn-frontend takes the next engine its heuristics offer. Load it with LD_PRELOAD.
#include <dlfcn.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

// from cuDNN 9's cudnn_graph.h, which needs CUDA's headers besides; its ABI keeps them
typedef void *cudnnBackendDescriptor_t;
typedef int cudnnStatus_t;
enum { CUDNN_STATUS_SUCCESS = 0, CUDNN_STATUS_NOT_SUPPORTED = 3000 };
enum { CUDNN_TYPE_INT64 = 3, CUDNN_TYPE_BACKEND_DESCRIPTOR = 15 };
enum { CUDNN_BACKEND_ENGINE_DESCRIPTOR = 2 };
enum {
    CUDNN_ATTR_ENGINECFG_ENGINE = 300,
    CUDNN_ATTR_EXECUTION_PLAN_ENGINE_CONFIG = 401,
    CUDNN_ATTR_ENGINE_GLOBAL_INDEX = 1301,
};

static void *real(const char *name) {
    // ORT loads cuDNN privately, out of RTLD_NEXT's reach, and has it loaded before it builds a plan
    return dlsym(dlopen("libcudnn.so.9", RTLD_LAZY | RTLD_NOLOAD), name);
}

static int blocked(int64_t engine) {
    const char *list = getenv("BLOCKED_CUDNN_ENGINES");
    while (list && *list) {
        char *end;
        if (strtoll(list, &end, 10) == engine && end != list) {
            return 1;
        }
        list = *end == ',' ? end + 1 : NULL;
    }
    return 0;
}

cudnnStatus_t cudnnBackendSetAttribute(cudnnBackendDescriptor_t descriptor, int name, int type, int64_t count,
                                       const void *elements) {
    static cudnnStatus_t (*set)(cudnnBackendDescriptor_t, int, int, int64_t, const void *);
    static cudnnStatus_t (*get)(cudnnBackendDescriptor_t, int, int, int64_t, int64_t *, void *);
    static cudnnStatus_t (*create)(int, cudnnBackendDescriptor_t *);
    static cudnnStatus_t (*destroy)(cudnnBackendDescriptor_t);
    static int announced;
    if (!set) {
        get = real("cudnnBackendGetAttribute");
        create = real("cudnnBackendCreateDescriptor");
        destroy = real("cudnnBackendDestroyDescriptor");
        set = real("cudnnBackendSetAttribute");
    }
    if (name == CUDNN_ATTR_EXECUTION_PLAN_ENGINE_CONFIG && count == 1) {
        cudnnBackendDescriptor_t engine;
        int64_t found, index = -1;
        if (create(CUDNN_BACKEND_ENGINE_DESCRIPTOR, &engine) == CUDNN_STATUS_SUCCESS) {
            if (get(*(cudnnBackendDescriptor_t const *)elements, CUDNN_ATTR_ENGINECFG_ENGINE,
                    CUDNN_TYPE_BACKEND_DESCRIPTOR, 1, &found, &engine) == CUDNN_STATUS_SUCCESS) {
                get(engine, CUDNN_ATTR_ENGINE_GLOBAL_INDEX, CUDNN_TYPE_INT64, 1, &found, &index);
            }
            destroy(engine);
        }
        if (blocked(index)) {
            if (!announced++) {
                fprintf(stderr, "cudnn_block_engines: refusing engine %lld\n", (long long)index);
            }
            return CUDNN_STATUS_NOT_SUPPORTED;
        }
    }
    return set(descriptor, name, type, count, elements);
}
