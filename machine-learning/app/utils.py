import shutil
from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from fastapi import UploadFile

@contextmanager
def saved_image(upload_file: UploadFile) -> Path:
    try:
        suffix = Path(upload_file.filename).suffix
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(upload_file.file, tmp)
            tmp_path = Path(tmp.name)
        upload_file.file.close()
        yield tmp_path
    finally:
        tmp_path.unlink()
    
