FROM python:3.9.16-slim-bullseye

RUN mkdir -p /app/core
WORKDIR /app/core

COPY . /app/core
RUN apt-get update \
    && pip install --upgrade pip && pip cache purge && pip install --upgrade setuptools \
    && pip install -U pip \
    && pip install -r requirements.txt --no-cache

CMD ["python", "run.py"]