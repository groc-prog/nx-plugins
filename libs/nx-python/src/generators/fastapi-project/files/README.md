# FastAPI application <%= projectName %>

## 🚀 How to run locally

### With command line
Install dependencies:
```bash
pnpx nx run <%= projectName %>:install
```

Activate virtual environment created at `<%= projectName %>/.venv` and run the FastAPI server
```bash
uvicorn <%= projectName %>.main:app --reload
```

### With docker image
Build the image
```bash
docker build -t <%= moduleName %> ./services/<%= projectName %>/Dockerfile
```

Run the container
```bash
docker run -p <%= port %>:<%= port %> <%= moduleName %>
```

## ⚡️ Next steps

- [ ] Write some code
- [ ] Add tests
- [ ] Update this documentation
