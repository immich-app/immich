export MACHINE_LEARNING_CACHE_FOLDER=/tmp/model_cache
export MACHINE_LEARNING_MIN_FACE_SCORE=0.034 # returns 1 face per request; setting this to 0 blows up the number of faces to the thousands
export MACHINE_LEARNING_MIN_TAG_SCORE=0.0
export PID_FILE=/tmp/locust_pid
export LOG_FILE=/tmp/gunicorn.log
export HEADLESS=false
export HOST=127.0.0.1:3003
export CONCURRENCY=4
export NUM_ENDPOINTS=3
export PYTHONPATH=app

gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker \
    --bind $HOST --daemon --error-logfile $LOG_FILE --pid $PID_FILE
while true ; do
    echo "Loading models..."
    sleep 5
    if cat $LOG_FILE | grep -q -E "startup complete"; then break; fi
done

# "users" are assigned only one task, so multiply concurrency by the number of tasks
locust --host http://$HOST --web-host 127.0.0.1 \
    --run-time 120s --users $(($CONCURRENCY * $NUM_ENDPOINTS)) $(if $HEADLESS; then echo "--headless"; fi)

if [[ -e $PID_FILE ]]; then kill $(cat $PID_FILE); fi