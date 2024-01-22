#include <fstream>
#include <mutex>
#include <atomic>

#include "armnn/IRuntime.hpp"
#include "armnn/INetwork.hpp"
#include "armnn/Types.hpp"
#include "armnnDeserializer/IDeserializer.hpp"
#include "armnnTfLiteParser/ITfLiteParser.hpp"
#include "armnnOnnxParser/IOnnxParser.hpp"

using namespace armnn;

struct IOInfos
{
    std::vector<BindingPointInfo> inputInfos;
    std::vector<BindingPointInfo> outputInfos;
};

// from https://rigtorp.se/spinlock/
struct SpinLock
{
    std::atomic<bool> lock_ = {false};

    void lock()
    {
        for (;;)
        {
            if (!lock_.exchange(true, std::memory_order_acquire))
            {
                break;
            }
            while (lock_.load(std::memory_order_relaxed))
                ;
        }
    }

    void unlock() { lock_.store(false, std::memory_order_release); }
};

class Ann
{

public:
    int load(const char *modelPath,
             bool fastMath,
             bool fp16,
             bool saveCachedNetwork,
             const char *cachedNetworkPath)
    {
        INetworkPtr network = loadModel(modelPath);
        IOptimizedNetworkPtr optNet = OptimizeNetwork(network.get(), fastMath, fp16, saveCachedNetwork, cachedNetworkPath);
        const IOInfos infos = getIOInfos(optNet.get());
        NetworkId netId;
        mutex.lock();
        Status status = runtime->LoadNetwork(netId, std::move(optNet));
        mutex.unlock();
        if (status != Status::Success)
        {
            return -1;
        }
        spinLock.lock();
        ioInfos[netId] = infos;
        mutexes.emplace(netId, std::make_unique<std::mutex>());
        spinLock.unlock();
        return netId;
    }

    void execute(NetworkId netId, const void **inputData, void **outputData)
    {
        spinLock.lock();
        const IOInfos *infos = &ioInfos[netId];
        auto m = mutexes[netId].get();
        spinLock.unlock();
        InputTensors inputTensors;
        inputTensors.reserve(infos->inputInfos.size());
        size_t i = 0;
        for (const BindingPointInfo &info : infos->inputInfos)
            inputTensors.emplace_back(info.first, ConstTensor(info.second, inputData[i++]));
        OutputTensors outputTensors;
        outputTensors.reserve(infos->outputInfos.size());
        i = 0;
        for (const BindingPointInfo &info : infos->outputInfos)
            outputTensors.emplace_back(info.first, Tensor(info.second, outputData[i++]));
        m->lock();
        runtime->EnqueueWorkload(netId, inputTensors, outputTensors);
        m->unlock();
    }

    void unload(NetworkId netId)
    {
        mutex.lock();
        runtime->UnloadNetwork(netId);
        mutex.unlock();
    }

    int tensors(NetworkId netId, bool isInput = false)
    {
        spinLock.lock();
        const IOInfos *infos = &ioInfos[netId];
        spinLock.unlock();
        return (int)(isInput ? infos->inputInfos.size() : infos->outputInfos.size());
    }

    unsigned long shape(NetworkId netId, bool isInput = false, int index = 0)
    {
        spinLock.lock();
        const IOInfos *infos = &ioInfos[netId];
        spinLock.unlock();
        const TensorShape shape = (isInput ? infos->inputInfos : infos->outputInfos)[index].second.GetShape();
        unsigned long s = 0;
        for (unsigned int d = 0; d < shape.GetNumDimensions(); d++)
            s |= ((unsigned long)shape[d]) << (d * 16); // stores up to 4 16-bit values in a 64-bit value
        return s;
    }

    Ann(int tuningLevel, const char *tuningFile)
    {
        IRuntime::CreationOptions runtimeOptions;
        BackendOptions backendOptions{"GpuAcc",
                                      {
                                          {"TuningLevel", tuningLevel},
                                          {"MemoryOptimizerStrategy", "ConstantMemoryStrategy"}, // SingleAxisPriorityList or ConstantMemoryStrategy
                                      }};
        if (tuningFile)
            backendOptions.AddOption({"TuningFile", tuningFile});
        runtimeOptions.m_BackendOptions.emplace_back(backendOptions);
        runtime = IRuntime::CreateRaw(runtimeOptions);
    };
    ~Ann()
    {
        IRuntime::Destroy(runtime);
    };

private:
    INetworkPtr loadModel(const char *modelPath)
    {
        const auto path = std::string(modelPath);
        if (path.rfind(".tflite") == path.length() - 7) // endsWith()
        {
            auto parser = armnnTfLiteParser::ITfLiteParser::CreateRaw();
            return parser->CreateNetworkFromBinaryFile(modelPath);
        }
        else if (path.rfind(".onnx") == path.length() - 5) // endsWith()
        {
            auto parser = armnnOnnxParser::IOnnxParser::CreateRaw();
            return parser->CreateNetworkFromBinaryFile(modelPath);
        }
        else
        {
            std::ifstream ifs(path, std::ifstream::in | std::ifstream::binary);
            auto parser = armnnDeserializer::IDeserializer::CreateRaw();
            return parser->CreateNetworkFromBinary(ifs);
        }
    }

    static BindingPointInfo getInputTensorInfo(LayerBindingId inputBindingId, TensorInfo info)
    {
        const auto newInfo = TensorInfo{info.GetShape(), info.GetDataType(),
                                        info.GetQuantizationScale(),
                                        info.GetQuantizationOffset(),
                                        true};
        return {inputBindingId, newInfo};
    }

    IOptimizedNetworkPtr OptimizeNetwork(INetwork *network, bool fastMath, bool fp16, bool saveCachedNetwork, const char *cachedNetworkPath)
    {
        const bool allowExpandedDims = false;
        const ShapeInferenceMethod shapeInferenceMethod = ShapeInferenceMethod::ValidateOnly;

        OptimizerOptionsOpaque options;
        options.SetReduceFp32ToFp16(fp16);
        options.SetShapeInferenceMethod(shapeInferenceMethod);
        options.SetAllowExpandedDims(allowExpandedDims);

        BackendOptions gpuAcc("GpuAcc", {{"FastMathEnabled", fastMath}});
        if (cachedNetworkPath)
        {
            gpuAcc.AddOption({"SaveCachedNetwork", saveCachedNetwork});
            gpuAcc.AddOption({"CachedNetworkFilePath", cachedNetworkPath});
        }
        options.AddModelOption(gpuAcc);

        // No point in using ARMNN for CPU, use ONNX (quantized) instead.
        // BackendOptions cpuAcc("CpuAcc",
        //                       {
        //                           {"FastMathEnabled", fastMath},
        //                           {"NumberOfThreads", 0},
        //                       });
        // options.AddModelOption(cpuAcc);

        BackendOptions allowExDimOpt("AllowExpandedDims",
                                     {{"AllowExpandedDims", allowExpandedDims}});
        options.AddModelOption(allowExDimOpt);
        BackendOptions shapeInferOpt("ShapeInferenceMethod",
                                     {{"InferAndValidate", shapeInferenceMethod == ShapeInferenceMethod::InferAndValidate}});
        options.AddModelOption(shapeInferOpt);

        std::vector<BackendId> backends = {
            BackendId("GpuAcc"),
            // BackendId("CpuAcc"),
            // BackendId("CpuRef"),
        };
        return Optimize(*network, backends, runtime->GetDeviceSpec(), options);
    }

    IOInfos getIOInfos(IOptimizedNetwork *optNet)
    {
        struct InfoStrategy : IStrategy
        {
            void ExecuteStrategy(const IConnectableLayer *layer,
                                 const BaseDescriptor &descriptor,
                                 const std::vector<ConstTensor> &constants,
                                 const char *name,
                                 const LayerBindingId id = 0) override
            {
                IgnoreUnused(descriptor, constants, id);
                const LayerType lt = layer->GetType();
                if (lt == LayerType::Input)
                    ioInfos.inputInfos.push_back(getInputTensorInfo(id, layer->GetOutputSlot(0).GetTensorInfo()));
                else if (lt == LayerType::Output)
                    ioInfos.outputInfos.push_back({id, layer->GetInputSlot(0).GetTensorInfo()});
            }
            IOInfos ioInfos;
        };

        InfoStrategy infoStrategy;
        optNet->ExecuteStrategy(infoStrategy);
        return infoStrategy.ioInfos;
    }

    IRuntime *runtime;
    std::map<NetworkId, IOInfos> ioInfos;
    std::map<NetworkId, std::unique_ptr<std::mutex>> mutexes; // mutex per network to not execute the same the same network concurrently
    std::mutex mutex; // global mutex for load/unload calls to the runtime
    SpinLock spinLock; // fast spin lock to guard access to the ioInfos and mutexes maps
};

extern "C" void *init(int logLevel, int tuningLevel, const char *tuningFile)
{
    LogSeverity level = static_cast<LogSeverity>(logLevel);
    ConfigureLogging(true, true, level);

    Ann *ann = new Ann(tuningLevel, tuningFile);
    return ann;
}

extern "C" void destroy(void *ann)
{
    delete ((Ann *)ann);
}

extern "C" int load(void *ann,
                    const char *path,
                    bool fastMath,
                    bool fp16,
                    bool saveCachedNetwork,
                    const char *cachedNetworkPath)
{
    return ((Ann *)ann)->load(path, fastMath, fp16, saveCachedNetwork, cachedNetworkPath);
}

extern "C" void unload(void *ann, NetworkId netId)
{
    ((Ann *)ann)->unload(netId);
}

extern "C" void execute(void *ann, NetworkId netId, const void **inputData, void **outputData)
{
    ((Ann *)ann)->execute(netId, inputData, outputData);
}

extern "C" unsigned long shape(void *ann, NetworkId netId, bool isInput, int index)
{
    return ((Ann *)ann)->shape(netId, isInput, index);
}

extern "C" int tensors(void *ann, NetworkId netId, bool isInput)
{
    return ((Ann *)ann)->tensors(netId, isInput);
}