# CytoML Demo: Site

Interface da demonstração, em React + Vite + Tailwind CSS. A descrição do projeto, a API e a execução completa estão no [README principal](../README.md).

```bash
npm install
VITE_API_URL=http://localhost:8080 npm run dev    # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento, com recarga automática |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run lint` | Verifica o código com o ESLint |

Sem `VITE_API_URL`, o site usa a API publicada no Cloud Run.
