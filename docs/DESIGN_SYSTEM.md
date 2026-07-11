# Design System

## Direção

Premium, minimalista e editorial. A interface usa bastante espaço livre, hierarquia tipográfica forte e poucos contêineres. No catálogo, as fotografias devem ser protagonistas. Evitar gradientes decorativos, excesso de cards, sombras pesadas e aparência infantil ou de template genérico.

## Cores

| Token | Valor | Uso |
|---|---:|---|
| `ink` | `#111111` | Texto principal e contraste máximo |
| `warm-white` | `#FAF9F6` | Fundo principal |
| `soft-gray` | `#EDEDED` | Fundos secundários e estados neutros |
| `muted` | `#6B6B6B` | Texto auxiliar |
| `petrol` | `#1F4D4F` | Ações, marca e destaques |
| `deep-petrol` | `#083D40` | Hover e áreas de alto contraste |
| `line` | `#DEDDD9` | Divisórias discretas |

Contraste deve atender WCAG AA. Azul petróleo com texto branco é reservado às ações principais; textos longos usam `ink` ou `muted` sobre fundos claros.

## Tipografia

- **Interface:** Arial/Helvetica nesta fundação, sem download externo. Limpa e legível.
- **Editorial:** Georgia para títulos e momentos de marca.
- Título hero: `56–112px`, linha `0.88–0.95`, tracking negativo.
- H1 interno: `40–64px`; H2: `28–40px`; corpo: `16px/1.6`; auxiliar: `12–14px`.
- Caixa alta e tracking amplo apenas em etiquetas curtas.

Uma fonte hospedada localmente pode substituir as pilhas do sistema mais tarde, sem alterar os tokens.

## Espaçamento e layout

- Escala: `4, 8, 12, 16, 24, 32, 48, 64, 96px`.
- Conteúdo: máximo de `1280px`, margens móveis de `20px` e desktop de `40px`.
- Mobile-first, com breakpoints apenas quando o conteúdo exigir.
- Bordas retas ou raio discreto; não transformar cada bloco em card.
- Alvos interativos com no mínimo `44×44px`.

## Componentes principais

- `Button`: primário petróleo, secundário por borda e ação textual.
- `Input`, `Textarea`, `Select`: label visível, ajuda/erro e foco evidente.
- `Header`: navegação curta, marca e ação principal.
- `ProductCard`: imagem dominante, nome, preço, promoção e indisponibilidade.
- `ProductGallery`: imagem principal e miniaturas acessíveis.
- `OptionSelector`: botões/radios para valores de variação.
- `QuantitySelector`: respeita estoque e comunica limites.
- `CartItem` e `CartSummary`: edição direta e total claro.
- `OrderStatus`: quatro estados, com texto além da cor.
- `EmptyState`, `Dialog`, `Toast` e `Skeleton`: somente quando necessários ao fluxo.

## Acessibilidade

HTML semântico, navegação por teclado, foco visível, rótulos explícitos, mensagens de erro associadas e respeito a `prefers-reduced-motion`. Ícones nunca substituem sozinhos textos essenciais.
