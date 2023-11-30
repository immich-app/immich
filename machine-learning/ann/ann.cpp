#include <fstream>

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
        Status status = runtime->LoadNetwork(netId, std::move(optNet));
        if (status != Status::Success)
        {
            return -1;
        }
        ioInfos[netId] = infos;
        return netId;
    }

    void execute(NetworkId netId, const void **inputData, void **outputData)
    {
        const IOInfos *infos = &ioInfos[netId];
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
        runtime->EnqueueWorkload(netId, inputTensors, outputTensors);
    }

    void unload(NetworkId netId)
    {
        runtime->UnloadNetwork(netId);
    }

    int tensors(NetworkId netId, bool isInput = false)
    {
        return (int)(isInput ? ioInfos[netId].inputInfos.size() : ioInfos[netId].outputInfos.size());
    }

    unsigned long shape(NetworkId netId, bool isInput = false, int index = 0)
    {
        const TensorShape shape = (isInput ? ioInfos[netId].inputInfos : ioInfos[netId].outputInfos)[index].second.GetShape();
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