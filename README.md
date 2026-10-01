# BrickGEST

Projeto independente criado a partir da base visual e técnica de `C0937-inv`.

## Relação com o projeto original

- O código foi copiado para servir de ponto de partida.
- Este projeto tem o seu próprio repositório e histórico Git.
- Alterações futuras em `C0937-inv` não entram automaticamente no BrickGEST.
- O projeto original deve ser usado como referência ao adaptar componentes.

## Segurança da integração Google

Os identificadores de OAuth, Google Sheet e Apps Script foram deliberadamente removidos da cópia. Configure recursos próprios do BrickGEST nas constantes existentes no início de `app.js`; não reutilize os identificadores do inventário 0937.

## Desenvolvimento local

```powershell
python -m http.server 3000
```

Depois aceda a `http://localhost:3000/`.
