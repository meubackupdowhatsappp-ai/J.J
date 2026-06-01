/*=============== MENU HAMBÚRGUER ===============*/
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('open-menu');
const navClose = document.getElementById('close-menu');

/* MOSTRAR MENU */
if (navToggle) {
    navToggle.addEventListener('click', () => {
        // Agora aplicamos a classe show-menu direto no body
        document.body.classList.add('show-menu');
    });
}

/* ESCONDER MENU */
if (navClose) {
    navClose.addEventListener('click', () => {
        // E removemos do body ao fechar
        document.body.classList.remove('show-menu');
    });
}

// Aguarda o carregamento COMPLETO da página
window.addEventListener('load', function() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        // Adiciona a classe que faz a tela sumir suavemente
        loadingScreen.classList.add('esconder-loading');

        // Opcional, mas recomendado: remove o elemento do código após o fade-out 
        // para não atrapalhar cliques ou pesar a memória (0.5s é o tempo da transition no CSS)
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); 
    }
});