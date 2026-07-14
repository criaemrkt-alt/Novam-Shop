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

O bloqueio definitivo contra venda acima do estoque ocorre na RPC transacional `create_public_order`. Ela bloqueia os registros durante a validação, recalcula preços usando o banco, cria pedido e itens e baixa o estoque atomicamente. `orders.checkout_token` torna tentativas repetidas idempotentes. A estrutura está na migration `supabase/migrations/202607120009_transactional_checkout.sql`.

## Variações de produto

Variações são opcionais. Um produto simples mantém `stock_mode = 'product'`; um produto com escolhas usa `stock_mode = 'variant'` mesmo quando o controle de estoque está desligado. Assim, o checkout sempre exige uma variante válida para produtos com tamanho, cor ou modelo.

- `product_options`: define os eixos ordenados, como Tamanho e Cor.
- `product_option_values`: define e ordena os valores de cada eixo, como P/M/G e Preto/Branco.
- `product_variants`: representa somente combinações vendáveis. Cada variante pode sobrescrever preço, promoção, SKU, estoque e status.
- Ausência de uma combinação significa que ela não existe; variante inativa ou com estoque zero não pode ser comprada.
- Se preço e promoção da variante forem nulos, o checkout usa os valores padrão do produto.

A migration `supabase/migrations/202607140011_product_variations.sql` cria duas RPCs autenticadas e atômicas. `save_owned_product_variations` substitui a configuração completa somente após validar que `auth.uid()` é o proprietário da loja; `disable_owned_product_variations` retorna o item ao modo simples. A mesma migration atualiza `sync_anonymous_cart` para calcular preços e estoques de variantes no servidor. Nenhuma dessas funções aceita preço livre do navegador como valor definitivo de compra.

## Segurança e acesso público

- Leitura pública: loja ativa; categorias e produtos ativos; imagens e opções ligadas a produto público.
- Escrita administrativa: somente usuário autenticado dono da loja.
- Pedidos: o dono lê e muda status. Não existe inserção anônima direta nas tabelas; o checkout público usa somente a RPC `security definer` validada e transacional. A função recebe IDs e quantidades, nunca aceita preços calculados pelo navegador.
- Nenhuma service role key deve chegar ao navegador.

## Arquivos

O bucket público `store-assets` recebe logo, banner e fotos de produtos em JPG, PNG ou WebP, limitados a 5 MB. Os caminhos seguem `{owner_id}/{store_id}/...`. As políticas de `storage.objects` permitem escrita somente quando a primeira pasta corresponde ao usuário autenticado. A migration está em `supabase/migrations/202607110001_storage_buckets.sql` e deve ser aplicada antes de testar uploads.

## Tema da loja

As colunas `theme_preset`, `theme_primary`, `theme_accent`, `theme_background` e `theme_text` guardam a identidade escolhida pelo lojista. As cores usam hexadecimal completo e possuem constraints no banco. A migration está em `supabase/migrations/202607110002_store_theme.sql`. A vitrine pública consome essas cores como variáveis CSS, sem executar CSS fornecido pelo usuário.

## Textos da vitrine

`stores.hero_title` guarda a chamada comercial curta exibida sobre o banner. `stores.subtitle` guarda a frase de apoio exibida abaixo do banner. A descrição completa continua em `stores.description` e passa a compor a seção editorial “Sobre a loja” no final do catálogo. A separação evita usar um único conteúdo para três hierarquias diferentes. Os limites são validados na aplicação e no banco pela migration `supabase/migrations/202607110005_storefront_copy.sql`.

`stores.show_hero_content` permite ao lojista ocultar a chamada, o selo e o CTA sobre o banner, preservando a arte original sem camada de contraste. O subtítulo abaixo do banner permanece independente. A coluna é adicionada pela migration `supabase/migrations/202607110006_optional_hero_content.sql`.

`store_banners` guarda até cinco posições por loja. Cada posição exige `desktop_path` e aceita `mobile_path` opcional; quando não existe versão mobile, a vitrine usa a imagem desktop. A constraint de posição entre 0 e 4, combinada à unicidade `(store_id, position)`, limita estruturalmente o carrossel a cinco banners. A leitura pública exige loja publicada e a escrita usa `can_manage_store`, mantendo isolamento por loja. A migration está em `supabase/migrations/202607110007_store_banners.sql`.

## Conteúdo comercial do produto

Além de `description`, os produtos podem guardar `materials`, `lead_time` e `customization_notes`. Todos são opcionais e aparecem como informações estruturadas na página individual do produto. Os limites são validados na aplicação e por constraints adicionadas em `supabase/migrations/202607120008_product_sales_details.sql`. Esses campos permanecem sob as mesmas políticas RLS de `products`.

## Migration inicial

O SQL completo está em `supabase/migrations/202607100001_initial_schema.sql`. Ele é local e versionado; não foi aplicado ao projeto remoto.
