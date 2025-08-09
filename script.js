class CorretorRedacao {
  constructor() {
    this.redacoes = {
      exemplos: []
    };
    this.init();
  }

  async init() {
    try {
      await this.carregarRedacoes();
      console.log("Redações carregadas com sucesso");
    } catch (error) {
      console.error("Erro ao carregar redações:", error);
    }
  }

  async carregarRedacoes() {
    const response = await fetch("redacoes.json");
    if (!response.ok) throw new Error("Erro ao carregar redacoes.json");
    const dados = await response.json();
    this.redacoes = dados;
  }

  formatarResposta(resposta) {
    let textoFormatado = resposta
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/~~/g, '')
      .replace(/```/g, '')
      .replace(/`/g, '')
      .replace(/---+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/<\/?[^>]+(>|$)/g, '');

    textoFormatado = textoFormatado
      .replace(/(Nota Final: \d+\/1000)/, '===== $1 =====\n\n')
      .replace(/(Detalhamento por Competência:)/, '\n$1\n\n')
      .replace(/(Competência [IVXLCDM]+ \(.*?\): \d+\/200)/g, '\n$1\n')
      .replace(/(Pontos Fortes:|Ajustes:)/g, '\n$1\n')
      .replace(/(Recomendações para Melhoria:|Observação Final:)/g, '\n\n$1\n\n')
      .replace(/(\d+\.)\s/g, '\n$1 ')
      .replace(/\n{3,}/g, '\n\n');

    return textoFormatado.trim();
  }

  async corrigirRedacao() {
    const tema = document.getElementById("tema").value.trim();
    const redacao = document.getElementById("redacao").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    const resultadoContainer = document.getElementById("resultado-container");

    if (!tema || !redacao) {
      resultadoDiv.innerText = "Por favor, preencha o tema e a redação.";
      resultadoContainer.style.display = "block";
      return;
    }

    resultadoDiv.innerText = "Corrigindo, aguarde...";
    resultadoContainer.style.display = "block";
    this.toggleLoading(true);

    try {
      const prompt = this.criarPrompt(tema, redacao);
      const respostaBruta = await this.enviarParaAPI(prompt);
      const respostaFormatada = this.formatarResposta(respostaBruta);

      resultadoDiv.innerText = respostaFormatada || "Não houve resposta da IA.";
      resultadoContainer.style.display = "block";
    } catch (erro) {
      resultadoDiv.innerText = "Erro ao processar correção: " + erro.message;
      resultadoContainer.style.display = "block";
    } finally {
      this.toggleLoading(false);
    }
  }

  criarPrompt(tema, redacao) {
    const exemplos = this.redacoes.exemplos.map(ex => `Tema: ${ex.tema}\nNota: ${ex.nota}\nTexto: ${ex.texto}`).join('\n\n');

    return `Você é um assistente especializado em correção de redações do ENEM. Sua tarefa é avaliar a competência 3 da redação do usuário com base na competência 3 oficial do exame, fornecendo um feedback detalhado e atribuindo uma nota de 0 a 200.
Se a redação tiver menos de 7 linhas, a nota será 0. E se não tiver nada a ver com o tema, a nota também será 0, mesmo se a gramática estiver correta.



Competência III: Seleção e Organização de Argumentos
- Avalie a capacidade de selecionar, relacionar e interpretar informações em defesa de um ponto de vista.  
- Critérios de Pontuação:  
  - 0: Informações irrelevantes ou sem defesa de um ponto de vista.  
  - 40: Informações pouco relacionadas ao tema ou incoerentes.  
  - 80: Informações limitadas aos textos motivadores ou desorganizadas.  
  - 120: Informações relevantes, mas pouco organizadas.  
  - 160: Informações bem relacionadas e com indícios de autoria.  
  - 200: Informações consistentes, organizadas e com autoria clara.  


Exemplos de Redações Nota 1000:
${exemplos}

Tema: ${tema}

Redação do Usuário:
${redacao}`;
  }

  async enviarParaAPI(prompt) {
    const resposta = await fetch("https://pccbackend.vercel.app/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: "Você é um corretor de redações especializado no ENEM." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!resposta.ok) throw new Error("Erro na API");
    const dados = await resposta.json();
    return dados.choices?.[0]?.message?.content;
  }

  toggleLoading(loading) {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = loading ? "inline" : "none";
    }
  }

}