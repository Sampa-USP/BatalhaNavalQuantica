// === CONFIGURAÇÃO INICIAL ===
//const URL_BASE = "http://localhost:5000";
const URL_BASE = "https://pasv1jt1ca.execute-api.us-east-1.amazonaws.com/prod";
let backendSelecionado = null;

let canvasJogador, canvasComputador, contextoJogador, contextoComputador;

const TAMANHO_CELULA = 50;
const TAMANHO_TABULEIRO = 500;

let placar = {
  jogador: 0,
  computador: 0
};

function logBloco(titulo, dados, tipo = 'log') {
  console.groupCollapsed(titulo);
  if (Array.isArray(dados) && dados.every(row => Array.isArray(row))) {
    console.table(dados);
  } else {
    console[tipo](dados);
  }
  console.groupEnd();
}

function atualizarStatusBar(texto) {
  const barra = document.getElementById('statusBar');
  barra.innerText = `${texto}
🎯 Placar → Jogador: ${placar.jogador}  |  Computador: ${placar.computador}`;
  console.log("📢 StatusBar:", barra.innerText);
}

// // === FUNÇÕES DE DESENHO ===
// function desenharGrade(ctx) {
//   console.log(`🎨 desenharGrade chamada para o canvas: ${ctx.canvas.id}`);
//   ctx.clearRect(0, 0, TAMANHO_TABULEIRO, TAMANHO_TABULEIRO);
//   ctx.strokeStyle = "black";
//   for (let i = 0; i <= 10; i++) {
//     ctx.beginPath();
//     ctx.moveTo(i * TAMANHO_CELULA, 0);
//     ctx.lineTo(i * TAMANHO_CELULA, TAMANHO_TABULEIRO);
//     ctx.stroke();

//     ctx.beginPath();
//     ctx.moveTo(0, i * TAMANHO_CELULA);
//     ctx.lineTo(TAMANHO_TABULEIRO, i * TAMANHO_CELULA);
//     ctx.stroke();
//   }
// }

// Exemplo sem canvas, manipulando DOM diretamente:
function desenharAtaqueJogador(x, y, acertou) {
  const board = document.getElementById('computerBoard');
  const celula = board.querySelector(`[data-row="${y}"][data-col="${x}"]`);

  if (!celula) {
    console.warn(`❗Célula não encontrada para x=${x}, y=${y}`);
    return; // impede erro
  }

  if(acertou){
    celula.textContent = '🔥';
    celula.classList.add('acerto');
  } else {
    celula.classList.add('erro-jogador');
  }
}


function desenharAtaqueQuantico(x, y, acertou) {
  const board = document.getElementById('playerBoard');
  const celula = board.querySelector(`[data-row="${y}"][data-col="${x}"]`);

  if(acertou){
    celula.textContent = '🔥';
    celula.classList.add('acerto');
  } else {
    celula.classList.add('erro-quantico');
  }
}



function desenharNavios(tabuleiro) {
  const board = document.getElementById('playerBoard');
  for (let i = 0; i < tabuleiro.length; i++) {
    for (let j = 0; j < tabuleiro[i].length; j++) {
      if (tabuleiro[i][j] === 1) {
        const celula = board.querySelector(`[data-row="${i}"][data-col="${j}"]`);
        celula.classList.add('navio');
      }
    }
  }
}



// === INTERAÇÕES ===
function selecionarBackend(backend) {
  backendSelecionado = backend;
  const ids = ['sv1', 'dm1', 'tn1'];
  ids.forEach(id => {
    const img = document.getElementById(`img-${id}`);
    img.classList.toggle("selected", id === backend);
  });
}

function solicitarNome() {
  document.getElementById('nameInputContainer').style.display = 'block';
  document.getElementById("playerName").focus();
}

function confirmarNomeJogador() {
  const nome = document.getElementById('playerName').value.trim();
  const numNavios = parseInt(document.getElementById("numNavios").value);
  const tamanhoTabuleiro = parseInt(document.getElementById("tamanhoTabuleiro").value);
  const input = document.getElementById("playerMove");

  if (!nome) return alert("Digite seu nome!");

  logBloco("🚀 Enviando dados para iniciar o jogo", { nome, backend: backendSelecionado, num_navios: numNavios, tamanho_tabuleiro: tamanhoTabuleiro });

  fetch(`${URL_BASE}/iniciar_jogo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, backend: backendSelecionado, num_navios: numNavios, tamanho_tabuleiro: tamanhoTabuleiro })
  })
    .then(res => res.json())
    .then(data => {
      logBloco("✅ Jogo iniciado com sucesso", data);
      document.getElementById('nameInputContainer').style.display = 'none';
      atualizarStatusBar(`Jogo em andamento. Jogador: ${nome}`);
      document.getElementById('startButton').disabled = true;
      document.getElementById('waitButton').disabled = false;
      document.getElementById('endButton').disabled = false;
      desenharNavios(data.tabuleiro_jogador)
      atualizarRanking(data.ranking);
      atualizarFila(data.fila_espera);
      input.focus();
      input.select();
    });
}

//Ataque do jogador
function atacar() {
  const coordenada = document.getElementById("playerMove").value.trim();
  if (!coordenada) return alert("Digite uma coordenada válida!");

  fetch(`${URL_BASE}/atacar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coordenada })
  })
    .then(res => res.json())
    .then(data => {
      logBloco("🎯 Resultado do ataque:", data);

      const letra = coordenada[0].toUpperCase();
      const numero = parseInt(coordenada.slice(1));
      const x = numero - 1;
      const y = letra.charCodeAt(0) - 65;
      desenharAtaqueJogador(x, y, data.status === "acerto");

      if (data.status === "acerto") placar.jogador++;

      atualizarStatusBar(`Você atacou ${coordenada.toUpperCase()} → ${data.mensagem}`);
      processarRespostaAtaqueJogador(data);
      if (data.finalizado === true || data.finalizado === "true" || data.finalizado == true || data.finalizado == "true") {
        mostrarAlertaFinal(data.mensagem)
        desenharTabuleiroAdversario(data.tabuleiro_quantico);
        encerrarJogo()
        return;
      }
      document.getElementById("playerMove").value = "";
    });
}

function processarRespostaAtaqueJogador(data) {
  atualizarVez(data.vez_do_jogador);

  if (!data.vez_do_jogador) {
    setTimeout(() => ataqueComputador(), 850);
  }
}

function ataqueComputador() {
  fetch(`${URL_BASE}/ataque-quantico`)
    .then(res => res.json())
    .then(data => {
      const [linha, coluna] = data.jogada_quantica;
      const acertou = data.status === "acerto";
      desenharAtaqueQuantico(coluna, linha, acertou);
      atualizarStatusBar(data.mensagem);
      atualizarVez(data.vez_do_jogador);

      if (data.status === "acerto") placar.computador++;


      if (data.finalizado === true) {
        desenharTabuleiroAdversario(data.tabuleiro_quantico);
        requestAnimationFrame(() => {
            setTimeout(() => {
                mostrarAlertaFinal(data.mensagem);
                encerrarJogo();
            }, 3300); // tempo reduzido só para dar tempo do repaint
        });// pequeno delay para o tabuleiro ser redesenhado antes do alerta
        return;
      }

      if (!data.vez_do_jogador) {
        setTimeout(ataqueComputador, 600);
      }
    });
}

function encerrarJogo() {
  fetch(`${URL_BASE}/encerrar_jogo`, { method: "POST" })
    .then(res => res.json())
    .then(() => {
      console.log("🔚 Jogo encerrado");
      document.getElementById('startButton').disabled = false;
      document.getElementById('waitButton').disabled = true;
      document.getElementById('endButton').disabled = true;
      atualizarStatusBar("");
      document.getElementById('playerName').value = "";
      document.getElementById('nameInputContainer').style.display = 'none';
      desenharGrade(contextoJogador);
      desenharGrade(contextoComputador);
      placar.jogador = 0;
      placar.computador = 0;
    });
}

function entrarNaFila() {
  const nome = document.getElementById('playerName').value.trim();
  if (!nome) return alert("Nome inválido para entrar na fila.");

  logBloco("🕓 Entrando na fila de espera com nome:", nome);

  fetch(`${URL_BASE}/fila/entrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome })
  })
    .then(res => res.json())
    .then(data => atualizarFila(data.fila_espera));
}

// === ATUALIZAÇÃO DE UI ===
function atualizarRanking(ranking) {
  const lista = document.getElementById("rankingList");
  lista.innerHTML = "";
  ranking.forEach((jogador, i) => {
    const li = document.createElement("li");
    li.textContent = `${jogador.nome} - ${jogador.pontos} pts`;
    li.style.fontWeight = "bold";
    if (i === 0) li.style.color = "gold";
    else if (i === 1) li.style.color = "silver";
    else if (i === 2) li.style.color = "brown";
    lista.appendChild(li);
  });
}

function atualizarFila(fila) {
  const lista = document.getElementById("esperaList");
  lista.innerHTML = "";
  fila.forEach(nome => {
    const li = document.createElement("li");
    li.textContent = nome;
    lista.appendChild(li);
  });
}

function atualizarVez(vezDoJogador) {
  const vezDiv = document.getElementById("vez-indicador");
  if (vezDoJogador) {
    vezDiv.innerHTML = "🟢 Sua vez de atacar!";
    vezDiv.className = "vez-status vez-jogador";
  } else {
    vezDiv.innerHTML = "⏳ Esperando ataque quântico...";
    vezDiv.className = "vez-status vez-computador";
  }
}

// === INICIALIZAÇÃO ===
window.onload = () => {

  console.log("📦 Página carregada — iniciando setup do jogo");
  const containerJogador = document.querySelector('.tabuleiro-jogador');
  const containerComputador = document.querySelector('.tabuleiro-computador');

  renderizarTabuleiro(containerJogador, 10, 'playerBoard');
  renderizarTabuleiro(containerComputador, 10, 'computerBoard');

  // const tamanho = parseInt(document.getElementById('tamanhoTabuleiro').value);
  
  // // Obtém os containers dos tabuleiros
  // const playerBoard = document.getElementById('playerBoard');
  // const computerBoard = document.getElementById('computerBoard');
  
  //   // Dispara o evento 'change' para renderizar o tabuleiro de imediato
  // tamanhoSelect.dispatchEvent(new Event('change'));
  // // // Renderiza os dois tabuleiros dinamicamente
  // // renderizarTabuleiro(playerBoard, tamanho);
  // // renderizarTabuleiro(computerBoard, tamanho);
  // document.addEventListener('DOMContentLoaded', () => {
  //   const playerBoard = document.getElementById('playerBoard');
  //   const computerBoard = document.getElementById('computerBoard');
  //   const tamanhoSelect = document.getElementById('tamanhoTabuleiro');
  //   const boardsContainer = document.querySelector('.boards'); // Container que envolve ambos os tabuleiros

  //   tamanhoSelect.addEventListener('change', function() {
  //     const tamanho = parseInt(this.value);

  //     // Renderiza os tabuleiros dinamicamente
  //     renderizarTabuleiro(playerBoard, tamanho);
  //     renderizarTabuleiro(computerBoard, tamanho);

  //     // Calcula o tamanho total do tabuleiro (supondo 40px por célula)
  //     const boardSize = tamanho * 40;
  //     // Define um gap proporcional (por exemplo, 10% do tamanho do tabuleiro)
  //     const gap = boardSize * 0.1;
  //     boardsContainer.style.gap = gap + 'px';
  //   });
  // });


  // Exemplo de uso: ao carregar a página, renderiza o grid com um tamanho padrão

  // alert("here")
  // const tamanhoDefault = 5; // ou qualquer valor desejado
  // criarTabuleiro(tamanhoDefault);
  // alert("here")

  fetch(`${URL_BASE}/estado`)
    .then(res => {
      console.log("🌐 Resposta recebida da rota /estado");
      return res.json();
    })
    .then(data => {
      logBloco("📊 Dados de estado inicial carregados", data);
      atualizarRanking(data.ranking);
      atualizarFila(data.fila_espera);
    })
    .catch(err => {
      console.error("❌ Erro ao buscar estado inicial:", err);
    });
};

function mostrarAlertaFinal(mensagem) {
  // Cria o overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = 9999;

  // Cria o alerta
  const alerta = document.createElement("div");
  alerta.style.backgroundColor = "#fff";
  alerta.style.padding = "30px";
  alerta.style.borderRadius = "10px";
  alerta.style.textAlign = "center";
  alerta.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";

  const titulo = document.createElement("h2");
  titulo.textContent = "🏁 Fim de Jogo";
  alerta.appendChild(titulo);

  const texto = document.createElement("p");
  texto.textContent = mensagem;
  alerta.appendChild(texto);

  const botao = document.createElement("button");
  botao.textContent = "Encerrar Jogo";
  botao.style.marginTop = "20px";
  botao.style.padding = "10px 20px";
  botao.style.border = "none";
  botao.style.backgroundColor = "#d9534f";
  botao.style.color = "#fff";
  botao.style.borderRadius = "5px";
  botao.style.cursor = "pointer";

  botao.onclick = () => {
    fetch(`${URL_BASE}/encerrar`, { method: "POST" })
      .then(() => {
        window.location.reload(); // ou redireciona para outra tela
      });
  };

  alerta.appendChild(botao);
  overlay.appendChild(alerta);
  document.body.appendChild(overlay);
}

// function criarTabuleiro(tamanho) {
//   // Atualiza a variável CSS para definir quantas colunas/linhas terá o grid
//   const gridContainer = document.getElementById('grid-container');
//   gridContainer.style.setProperty('--tamanho', tamanho);

//   // Limpa o grid
//   gridContainer.innerHTML = '';
//   // Cria as células do grid
//   for (let i = 0; i < tamanho; i++) {
//     for (let j = 0; j < tamanho; j++) {
//       const cell = document.createElement('div');
//       cell.classList.add('cell');
//       // Você pode adicionar data attributes para coordenadas, se necessário
//       cell.dataset.row = i;
//       cell.dataset.col = j;
//       gridContainer.appendChild(cell);
//     }
//   }

//   // Cria os rótulos das colunas (números)
//   const columnLabels = document.getElementById('column-labels');
//   columnLabels.innerHTML = '';
//   for (let j = 1; j <= tamanho; j++) {
//     const label = document.createElement('div');
//     label.classList.add('number-label');
//     label.textContent = j;
//     columnLabels.appendChild(label);
//   }

//   // Cria os rótulos das linhas (letras)
//   const rowLabels = document.getElementById('row-labels');
//   rowLabels.innerHTML = '';
//   for (let i = 0; i < tamanho; i++) {
//     const label = document.createElement('div');
//     label.classList.add('letter-label');
//     // Converte 0 -> A, 1 -> B, etc.
//     label.textContent = String.fromCharCode(65 + i);
//     rowLabels.appendChild(label);
//   }
// }


document.addEventListener('DOMContentLoaded', () => {
  const playerBoard = document.getElementById('playerBoard');
  const computerBoard = document.getElementById('computerBoard');
  const tamanhoSelect = document.getElementById('tamanhoTabuleiro');
  const boardsContainer = document.querySelector('.boards'); // Container que envolve ambos os tabuleiros

  tamanhoSelect.addEventListener('change', function() {
    const tamanho = parseInt(this.value);
    const containerJogador = document.querySelector('.tabuleiro-jogador');
    const containerComputador = document.querySelector('.tabuleiro-computador');

    renderizarTabuleiro(containerJogador, tamanho, 'playerBoard');
    renderizarTabuleiro(containerComputador, tamanho, 'computerBoard');

    // Calcula o tamanho total do tabuleiro (supondo 40px por célula)
    const boardSize = tamanho * 40;
    // Define um gap proporcional (por exemplo, 10% do tamanho do tabuleiro)
    const gap = boardSize * 0.1;
    boardsContainer.style.gap = gap + 'px';
  });
});

function renderizarTabuleiro(containerElement, tamanho, idTabuleiro) {
  containerElement.innerHTML = ''; // Limpa o container
  containerElement.id = idTabuleiro; // ← atribui dinamicamente o ID
  
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Linha superior com labels numéricos
  const linhaLabelsHorizontais = document.createElement('div');
  linhaLabelsHorizontais.classList.add('linha', 'label');
  
  const celulaVazia = document.createElement('div');
  celulaVazia.classList.add('celula', 'label');
  linhaLabelsHorizontais.appendChild(celulaVazia);

  for (let j = 0; j < tamanho; j++) {
    const celulaLabel = document.createElement('div');
    celulaLabel.classList.add('celula', 'label');
    celulaLabel.textContent = (j + 1);
    linhaLabelsHorizontais.appendChild(celulaLabel);
  }
  
  containerElement.appendChild(linhaLabelsHorizontais);

  // Grid com labels verticais
  for (let i = 0; i < tamanho; i++) {
    const linha = document.createElement('div');
    linha.classList.add('linha');

    const celulaLabelVertical = document.createElement('div');
    celulaLabelVertical.classList.add('celula', 'label');
    celulaLabelVertical.textContent = letras[i];
    linha.appendChild(celulaLabelVertical);

    for (let j = 0; j < tamanho; j++) {
      const celula = document.createElement('div');
      celula.classList.add('celula');
      celula.dataset.row = i;
      celula.dataset.col = j;
      linha.appendChild(celula);
    }

    containerElement.appendChild(linha);
  }
}

