FROM ghcr.io/astral-sh/uv:python3.14-trixie-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Runtime library useful if the model uses XGBoost.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency metadata first.
COPY pyproject.toml uv.lock ./

# Install production dependencies without development dependencies.
RUN uv sync --frozen --no-dev --no-install-project

# Copy the source code and trained model.
COPY src/ ./src/
COPY artifacts/ ./artifacts/

# Make the src/ layout importable.
ENV PYTHONPATH=/app/src

EXPOSE 8000

CMD ["uv", "run", "--no-sync", "uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]