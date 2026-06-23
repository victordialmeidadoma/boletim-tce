export const PROMPT_DIARIO = `Você é um especialista em leitura do Diário Oficial do TCE-MA.

Analise o PDF completo do Diário do TCE-MA e extraia TODAS as publicações encontradas.

Para cada publicação extraia os campos disponíveis e retorne um JSON com esta estrutura exata:
{
  "data": "YYYY-MM-DD",
  "publicacoes": [
    {
      "tipo": "TIPO_ENUM",
      "proc": "XXXX/AAAA ou null",
      "natureza": "texto ou null",
      "especie": "texto ou null",
      "exercicio": "AAAA ou null",
      "entidade": "nome completo da entidade ou null",
      "municipio": "NOME DO MUNICÍPIO EM MAIÚSCULAS ou null",
      "responsaveis": ["Nome Completo"] ou [],
      "relator": "Conselheiro X ou null",
      "prazo": "X dias ou null",
      "parecer_mp": "texto ou null",
      "decisao": "resumo do dispositivo em 1-2 frases ou null",
      "descricao": "resumo objetivo da publicação em 1-2 frases",
      "texto_original": "primeiros 500 caracteres do texto original da publicação"
    }
  ],
  "total": número total de publicações encontradas
}

TIPOS válidos para o campo "tipo":
- "PLENO_ACORDAO" — seção PLENO - ACÓRDÃO
- "PLENO_DECISAO" — seção PLENO - DECISÃO
- "PLENO_PARECER_PREVIO" — seção PLENO - PARECER PRÉVIO
- "DESPACHO" — seção DESPACHO
- "CITACAO" — seção CITAÇÃO
- "FISCALIZACAO_AVISO" — seção SECRETARIA DE FISCALIZAÇÃO - AVISO
- "FISCALIZACAO_RESULTADO" — seção SECRETARIA DE FISCALIZAÇÃO - RESULTADO
- "FISCALIZACAO_ACOMPANHAMENTO" — seção SECRETARIA DE FISCALIZAÇÃO - ACOMPANHAMENTO
- "FISCALIZACAO" — seção SECRETARIA DE FISCALIZAÇÃO (sem subtítulo específico)
- "PAUTA" — seção PAUTA
- "OUTROS" — qualquer outro tipo

REGRAS IMPORTANTES:
- Extraia TODAS as publicações, sem exceção
- Identifique o município pelo nome da entidade (ex: "Câmara Municipal de Matões do Norte" → "MATÕES DO NORTE")
- Para CITAÇÃO, extraia o prazo em dias
- Para PLENO, extraia o dispositivo (o que foi decidido)
- Para PAUTA, extraia o parecer do MP se houver
- A data deve ser a data de publicação do diário encontrada no cabeçalho
- Retorne APENAS o JSON, sem markdown, sem explicações`;