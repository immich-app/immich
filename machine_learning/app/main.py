from typing import Optional

from fastapi import FastAPI
import tensorflow as tf

app = FastAPI()


@app.get("/")
def read_root():
    print(tf.__version__)
    return {"Hello": "World 312"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}
