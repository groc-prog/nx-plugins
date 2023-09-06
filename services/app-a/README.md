# FastAPI application app-a

## 🚀 How to run locally

### With command line

Install dependencies:

```bash
pnpx nx run app-a:install
```

Activate virtual environment created at `app-a/.venv` and run the FastAPI server

```bash
uvicorn app-a.main:app --reload
```

### With docker image

Build the image

```bash
docker build -t app_a ./services/app-a/Dockerfile
```

Run the container

```bash
docker run -p 8000:8000 app_a
```

## ⚡️ Next steps

- [ ] Write some code
- [ ] Add tests
- [ ] Update this documentation
