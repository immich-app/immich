// Fails the cuDNN plans that would run engine 14, so that cuDNN takes the next engine it ranks: on Turing, that engine
// turns fp16 convolutions into NaN and garbage, as of cuDNN 9.27. immich_ml loads this there before ORT loads cuDNN.
#include <dlfcn.h>
#include <stdint.h>

// from cuDNN 9's cudnn_graph.h, whose ABI keeps them
enum { SUCCESS = 0, NOT_SUPPORTED = 3000, TYPE_INT64 = 3, TYPE_BACKEND_DESCRIPTOR = 15, ENGINE_DESCRIPTOR = 2 };
enum { ENGINECFG_ENGINE = 300, EXECUTION_PLAN_ENGINE_CONFIG = 401, ENGINE_GLOBAL_INDEX = 1301 };

static int (*set)(void *, int, int, int64_t, const void *);
static int (*get)(void *, int, int, int64_t, int64_t *, void *);
static int (*create)(int, void **);
static int (*destroy)(void *);

__attribute__((constructor)) static void resolve(void) {
    // the cuDNN that ORT then finds loaded; its symbols stay out of the global scope, where this library's come first
    void *cudnn = dlopen("libcudnn.so.9", RTLD_LAZY);
    set = dlsym(cudnn, "cudnnBackendSetAttribute");
    get = dlsym(cudnn, "cudnnBackendGetAttribute");
    create = dlsym(cudnn, "cudnnBackendCreateDescriptor");
    destroy = dlsym(cudnn, "cudnnBackendDestroyDescriptor");
}

int cudnnBackendSetAttribute(void *descriptor, int name, int type, int64_t count, const void *elements) {
    void *engine;
    int64_t found, index = -1;
    if (name == EXECUTION_PLAN_ENGINE_CONFIG && create(ENGINE_DESCRIPTOR, &engine) == SUCCESS) {
        get(*(void *const *)elements, ENGINECFG_ENGINE, TYPE_BACKEND_DESCRIPTOR, 1, &found, &engine);
        get(engine, ENGINE_GLOBAL_INDEX, TYPE_INT64, 1, &found, &index);
        destroy(engine);
    }
    return index == 14 ? NOT_SUPPORTED : set(descriptor, name, type, count, elements);
}
