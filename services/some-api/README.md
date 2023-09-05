# FastAPI application some-api

## 🚀 How to run locally

### With command line

Install dependencies:

```bash
pnpx nx run some-api:install
```

Activate virtual environment created at `some-api/.venv` and run the FastAPI server

```bash
uvicorn some-api.main:app --reload
```

### With docker image

Build the image

```bash
docker build -t some_api ./services/some-api/Dockerfile
```

Run the container

```bash
docker run -p 8000:8000 some_api
```

## ⚡️ Next steps

- [ ] Write some code
- [ ] Add tests
- [ ] Update this documentation
