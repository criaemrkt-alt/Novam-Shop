# Novam Shop — Escopo do MVP

## Produto

O Novam Shop é um microSaaS B2B para pequenos lojistas criarem um catálogo profissional. **Usuário** é o lojista pagante; **cliente** é quem compra na loja pública.

## Fluxo principal

1. O usuário cria uma conta com e-mail e senha.
2. Configura sua única loja.
3. Cadastra categorias, produtos, imagens, variações e estoque opcional.
4. O cliente acessa a loja pelo slug, escolhe itens e monta o carrinho.
5. O pedido é salvo no Supabase.
6. O atendimento e o pagamento continuam pelo WhatsApp, com mensagem organizada.

## Incluído

- Autenticação com e-mail e senha.
- Uma loja por usuário: nome, descrição, logo, banner, WhatsApp e slug único.
- Categorias e produtos com múltiplas imagens, descrição, preço normal, promoção opcional e estado ativo/inativo.
- Opções e valores (por exemplo: tamanho, cor e modelo) combinados em variações.
- Estoque opcional por produto ou por variação; bloqueio acima do saldo e indicação de indisponibilidade.
- Catálogo público responsivo, página de produto e carrinho.
- Registro de pedido e itens no Supabase.
- Finalização por WhatsApp.
- Painel administrativo e painel simples de pedidos.
- Status: `novo`, `confirmado`, `concluído` e `cancelado`.
- Experiência mobile-first e componentes acessíveis.

## Fora do MVP

Marketplace, gateway de pagamento, nota fiscal, transportadora, frete nacional, aplicativo nativo, afiliados, CRM avançado, automações de marketing, inteligência artificial, sistema financeiro, ERP, múltiplos planos complexos e qualquer recurso sem relação direta com o fluxo principal.

## Critérios de produto

- Simples de operar, manter e evoluir.
- Seguro por padrão: segredos fora do repositório e RLS em toda tabela pública.
- Sem dependências ou abstrações sem uso imediato.
- Interface premium, editorial, responsiva e centrada nos produtos.

## Fases sugeridas

1. Fundação (esta etapa): stack, Supabase local, schema inicial, documentação e identidade visual.
2. Autenticação e criação da loja.
3. Catálogo administrativo e upload de imagens.
4. Loja pública, produto e carrinho.
5. criação transacional do pedido e WhatsApp.
6. Painel de pedidos, testes de segurança e lançamento.
