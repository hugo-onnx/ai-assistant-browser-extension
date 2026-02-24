FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

COPY app/ app/

RUN chgrp -R 0 /app && chmod -R g=u /app && \
    mkdir -p /.cache/uv && chgrp -R 0 /.cache/uv && chmod -R g=u /.cache/uv

USER 1001

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]