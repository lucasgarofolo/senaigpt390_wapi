# API Endpoint - Atualização de Cursos

## Endpoint: POST /flow/atualizar-cursos

Este endpoint é responsável por receber arquivos CSV com informações dos cursos atualizados via Power Automate.

### Como usar:

1. **Instalar dependência necessária:**
   ```bash
   npm install multer
   ```

2. **Configuração no Power Automate:**
   - Use uma ação HTTP POST
   - URL: `https://seu-dominio.com/flow/atualizar-cursos`
   - Método: POST
   - Headers: `Content-Type: multipart/form-data`
   - Body: Envie o arquivo CSV no campo `cursos`

3. **Estrutura do arquivo CSV:**
   - Nome do arquivo: `cursos.csv` (ou qualquer nome com extensão .csv)
   - Tamanho máximo: 5MB
   - Formato: CSV (valores separados por vírgula)

### Respostas da API:

#### Sucesso (200):
```json
{
  "success": true,
  "message": "Arquivo CSV atualizado com sucesso!",
  "data": {
    "fileName": "cursos.csv",
    "fileSize": 1024,
    "linesProcessed": 50,
    "backupCreated": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Erro - Arquivo não enviado (400):
```json
{
  "success": false,
  "message": "Nenhum arquivo CSV foi enviado. Use o campo 'cursos' para enviar o arquivo."
}
```

#### Erro - Arquivo muito grande (400):
```json
{
  "success": false,
  "message": "Arquivo muito grande. Tamanho máximo permitido: 5MB"
}
```

#### Erro - Tipo de arquivo inválido:
```json
{
  "success": false,
  "message": "Apenas arquivos CSV são permitidos!"
}
```

### Funcionalidades implementadas:

1. **Upload seguro**: Apenas arquivos CSV são aceitos
2. **Validação de tamanho**: Limite de 5MB por arquivo
3. **Backup automático**: O arquivo anterior é salvo como `cursos_backup.csv`
4. **Logs detalhados**: Todas as operações são registradas no console
5. **Tratamento de erros**: Respostas claras para diferentes tipos de erro
6. **Limpeza automática**: Arquivos temporários são removidos após processamento

### Arquivos criados:

- `uploads/`: Diretório temporário para uploads
- `cursos.csv`: Arquivo principal com os cursos atualizados
- `cursos_backup.csv`: Backup do arquivo anterior

### Logs no console:

O sistema registra todas as operações com emojis para facilitar a identificação:
- 🔄 Processamento iniciado
- 📁 Arquivo recebido
- 📊 Dados processados
- ✅ Operação bem-sucedida
- ❌ Erros
- 💾 Backup criado
- 🗑️ Limpeza de arquivos temporários
