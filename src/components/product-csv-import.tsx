"use client";

export function ProductCsvImport() {
  return <details className="product-create product-csv-import">
    <summary><span>Importar produtos por planilha</span><b>+</b></summary>
    <div className="csv-import-body">
      <p>Cadastre até 100 produtos de uma vez com um arquivo CSV. As categorias precisam existir na loja. Imagens e variações podem ser adicionadas depois.</p>
      <a href="/modelo-importacao-produtos.csv" download>Baixar modelo CSV</a>
      <form action="/api/products/import" method="post" encType="multipart/form-data">
        <label className="upload-field"><span>Arquivo CSV</span><input name="file" type="file" accept=".csv,text/csv" required /><small>Colunas: nome, preco, descricao, categoria e estoque. Preço em reais (ex.: 29,90).</small></label>
        <button type="submit">Importar produtos</button>
      </form>
    </div>
  </details>;
}
