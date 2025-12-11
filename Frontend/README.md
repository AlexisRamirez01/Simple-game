# Frontend

Levantar servidor frontend:
- cd app-dotc/
- npm install
- npm run dev

Si en el paso 2 hay problemas por dependencias viejas, ejecutar los siguientes comandos:
- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
- source ~/.bashrc  # o ~/.zshrc
- nvm install 22
- nvm use 22
- rm -rf node_modules package-lock.json
- npm install
- npm run dev

# Documentación

- https://docs.google.com/spreadsheets/d/1e0tADkdCL98WSjb-7KbcJgFDNkLjb5B7FU6WuzMzucw/edit?gid=0#gid=0
    - Hoja 1: ENDPOINTS
    - Hoja 2: API / WEBSOCKETS
