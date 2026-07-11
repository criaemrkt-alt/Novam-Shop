# Banco de dados

## Princípios

- PostgreSQL no Supabase, UUIDs, `timestamptz` e valores monetários em centavos (`bigint`).
- Uma loja por usuário no MVP (`stores.owner_id` único).
- RLS habilitada em todas as tabelas do schema `public`.
- O proprietário gerencia dados somente quando `auth.uid()` corresponde ao `owner_id` da loja.
- Visitantes leem apenas lojas e conteúdos ativos.
- Itens de pedido guardam snapshots de nome, preço, SKU e opções, preservando o histórico após alterações no catálogo.

## Relações

| Entidade | Responsabilidade | Relações principais |
|---|---|---|
| `profiles` | Dados mínimos do usuário | PK = `auth.users.id` |
| `stores` | Configuração e endereço público | um proprietário; slug único |
| `categories` | Organização do catálogo | pertence à loja |
| `products` | Produto e estoque simples | loja; categoria opcional |
| `product_images` | Galeria ordenada | produto |
| `product_options` | Eixo de variação, como tamanho | produto |
| `product_option_values` | Valores, como P/M/G | opção |
| `product_variants` | Combinação vendável e estoque | produto; valores em `option_value_ids` |
| `orders` | Pedido e dados do cliente | loja |
| `order_items` | Snapshot de item comprado | pedido; referência opcional ao produto/variação |
| `order_item_options` | Snapshot das escolhas | item do pedido |

## Estoque

`products.track_stock = false` representa estoque ilimitado. Quando ativo e `stock_mode = 'product'`, usa-se `products.stock_quantity`. Quando `stock_mode = 'variant'`, cada combinação usa `product_variants.stock_quantity`. As constraints impedem quantidades negativas e configurações incoerentes. Um gatilho normaliza `option_value_ids` e rejeita valores duplicados ou pertencentes a outro produto; a chave composta de categoria também impede relações entre lojas diferentes.

O bloqueio definitivo contra venda acima do estoque deve ocorrer na função transacional de criação do pedido, e não somente na interface. Essa função será criada junto ao fluxo de checkout para validar itens, recalcular preços com dados do servidor, gravar o pedido e baixar estoque atomicamente.

## Segurança e acesso público

- Leitura pública: loja ativa; categorias e produtos ativos; imagens e opções ligadas a produto público.
- Escrita administrativa: somente usuário autenticado dono da loja.
- Pedidos: o dono lê e muda status. Não existe inserção anônima direta nas tabelas; o futuro checkout usará uma RPC `security definer` restrita, validada e transacional.
- Nenhuma service role key deve chegar ao navegador.

## Arquivos

O bucket público `store-assets` recebe logo, banner e fotos de produtos em JPG, PNG ou WebP, limitados a 5 MB. Os caminhos seguem `{owner_id}/{store_id}/...`. As políticas de `storage.objects` permitem escrita somente quando a primeira pasta corresponde ao usuário autenticado. A migration está em `supabase/migrations/202607110001_storage_buckets.sql` e deve ser aplicada antes de testar uploads.

## Tema da loja

As colunas `theme_preset`, `theme_primary`, `theme_accent`, `theme_background` e `theme_text` guardam a identidade escolhida pelo lojista. As cores usam hexadecimal completo e possuem constraints no banco. A migration está em `supabase/migrations/202607110002_store_theme.sql`. A vitrine pública consome essas cores como variáveis CSS, sem executar CSS fornecido pelo usuário.

## Migration inicial

O SQL completo está em `supabase/migrations/202607100001_initial_schema.sql`. Ele é local e versionado; não foi aplicado ao projeto remoto.
