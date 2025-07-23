function atualizarStatusBar(texto) {
    const barra = document.getElementById('statusBar');
    barra.innerText = `${texto}
🎯 Placar → Jogador: ${placar.jogador}  |  Computador: ${placar.computador}`;
    console.log("📢 StatusBar:", barra.innerText);
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
