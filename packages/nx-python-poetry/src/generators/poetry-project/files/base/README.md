# <%= projectName %>

<% if(isLib) { %>

## 🚀 How to register the package with apps or other packages

Run the following command to register the package with other apps or packages:

```bash
nx run <project>:add --local <%= projectName %>
```

## 📦 What's inside?

A short description of what awaits other developers inside this package.

## 📜 Package rules and conventions

Rules and conventions to follow when working on this package.

<% } else{ %>

## 🚀 How to start the development server

Run the following command to start a local development server with HMR:

```bash
nx run <%= projectName %>:serve
```

## 🔨 How to build your app

To build your app for production:

```bash
nx run <%= projectName %>:build
```

## 📦 What's inside?

A short description of what awaits other developers inside this app.

## 📜 App rules and conventions

Rules and conventions to follow when working on this app.

<% } %>

## ⚡️ Next steps

- [ ] Add your code inside the `<%= moduleName %>` directory
- [ ] Add tests
- [ ] Update this documentation
