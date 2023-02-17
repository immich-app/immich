# first stage
FROM python:3.10 AS builder

WORKDIR /usr/src/app

COPY requirements.txt .
COPY . .

# install dependencies to the local user directory (eg. /root/.local)
RUN pip install --user -r requirements.txt

# prod stage
FROM python:3.10-slim as prod
WORKDIR /usr/src/app

# copy only the dependencies installation from the 1st stage image
COPY --from=builder /root/.local /root/.local
COPY . .

# update PATH environment variable
ENV PATH=/root/.local:$PATH

# command to run on container start
CMD [ "python", "main.py" ]