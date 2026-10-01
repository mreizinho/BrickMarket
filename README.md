# BrickGEST

Site: https://mreizinho.github.io/brickgest/

Repositório: https://github.com/mreizinho/brickgest

Projeto independente criado a partir da base visual e técnica de `C0937-inv`.

## Relação com o projeto original

- O código foi copiado para servir de ponto de partida.
- Este projeto tem o seu próprio repositório e histórico Git.
- Alterações futuras em `C0937-inv` não entram automaticamente no BrickGEST.
- O projeto original deve ser usado como referência ao adaptar componentes.

## Segurança da integração Google

Os identificadores de OAuth, Google Sheet e Apps Script foram deliberadamente removidos da cópia. Configure recursos próprios do BrickGEST nas constantes existentes no início de `app.js`; não reutilize os identificadores do inventário 0937.

## Artigos Custom

Quando um EAN válido de 8 ou 13 dígitos não existe no catálogo, o teclado e a câmara oferecem a criação de um artigo Custom. O nome é obrigatório; ano, tema, subtema e número de peças são opcionais. O código é gerado como `CUSTOM-<EAN>`.

Os artigos são guardados na folha `CustomArticles`, criada automaticamente no primeiro registo por uma conta com acesso de Editor. A folha contém EAN, código, nome, ano, tema, subtema, peças, data de criação e email do utilizador. A app consulta esta folha juntamente com `BricksetDB` e não a altera ao atualizar o catálogo Brickset.

Guardar o artigo retoma o formulário do movimento ou adiciona-o ao lote/inventário; o movimento é confirmado pelo fluxo habitual. Criar o artigo não cria stock: uma saída ou transferência exige uma entrada anterior.

## Desenvolvimento local

```powershell
python -m http.server 3000
```

Depois aceda a `http://localhost:3000/`.
