FROM registry.baidubce.com/paddlepaddle/paddle:2.4.1

RUN pip3.7 install paddle-serving-client==0.9.0 && \
    pip3.7 install paddle-serving-app==0.9.0 && \
    pip3.7 install paddle-serving-server==0.9.0

RUN mkdir -p /home && cd /home && \
    wget https://github.com/PaddlePaddle/PaddleOCR/archive/refs/tags/v2.6.0.tar.gz && \
    tar xvf v2.6.0.tar.gz && \
    rm v2.6.0.tar.gz -f && \
    mv PaddleOCR-2.6.0 PaddleOCR && \
    pip3.7 install -r /home/PaddleOCR/requirements.txt

RUN name='ch_PP-OCRv3_det_infer' && wget https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/${name}.tar -O ${name}.tar && tar -xf ${name}.tar && \
    python3.7 -m paddle_serving_client.convert --dirname ./${name}/ --model_filename inference.pdmodel --params_filename inference.pdiparams --serving_server /home/PaddleOCR/deploy/pdserving/ppocr_det_v3_serving/ --serving_client /home/PaddleOCR/deploy/pdserving/ppocr_det_v3_client/ && \
    rm ${name}.tar && \
    rm ./${name}/ -rf && \
    name='ch_PP-OCRv3_rec_infer' && wget https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/${name}.tar -O ${name}.tar && tar -xf ${name}.tar && \
    python3.7 -m paddle_serving_client.convert --dirname ./${name}/ --model_filename inference.pdmodel --params_filename inference.pdiparams --serving_server /home/PaddleOCR/deploy/pdserving/ppocr_rec_v3_serving/ --serving_client /home/PaddleOCR/deploy/pdserving/ppocr_rec_v3_client/ && \
    rm ${name}.tar && \
    rm ./${name}/ -rf

COPY web_service.py config.yml /home/PaddleOCR/deploy/pdserving/ 

WORKDIR /home/PaddleOCR/deploy/pdserving/

CMD ["/bin/bash","-c","export PYTHONPATH=/home/PaddleOCR/deploy/pdserving/ && python3.7 web_service.py --config=config.yml"]

