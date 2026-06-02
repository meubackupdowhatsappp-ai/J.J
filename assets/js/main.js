// Importa o cliente do Supabase via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configurações do seu Supabase
const supabaseUrl = 'https://wiagaepfttjhxrsrrwkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYWdhZXBmdHRqaHhyc3Jyd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDM0MjYsImV4cCI6MjA5NTkxOTQyNn0._cqrmHKD-XkEzZ-MNvgCGnFbKmUribBqtI1El0a-9yA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Variáveis de controle
let momentos = [];
let currentIndex = 0;
const PRELOAD_AMOUNT = 5; // Quantidade inicial de mídias para carregar antes de mostrar a tela
const mediaCache = {};  

// Elementos da DOM
const contentContainer = document.getElementById('moment-content');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const momentSection = document.getElementById('moment-section');
const cronometroSection = document.getElementById('pre-cronometro-section');
const btnVoltarFinal = document.getElementById('btn-voltar-final');
const momentLine = document.querySelector('.moment-line');
const momentTitle = document.querySelector('.moment-title')
const modal = document.getElementById('moment-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.getElementById('close-modal');

// ==========================================
// SISTEMA DE PRÉ-CARREGAMENTO (PRELOAD)
// ==========================================

// Função que força o navegador a baixar e fazer cache das imagens/vídeos
function preloadMidias(startIndex, count) {
    return new Promise((resolve) => {
        let carregados = 0;
        const endIndex = Math.min(startIndex + count, momentos.length);
        const totalParaCarregar = endIndex - startIndex;

        if (totalParaCarregar <= 0) {
            resolve();
            return;
        }

        for (let i = startIndex; i < endIndex; i++) {
            // Se já carregou ou está carregando, pula (evita carregar a mesma coisa duas vezes)
            if (mediaCache[i]) {
                verificarCarregamento();
                continue;
            }

            const momento = momentos[i];
            const isVideo = momento.tipo_midia === 'video';

            if (isVideo) {
                const video = document.createElement('video');
                video.src = momento.midia_url;
                video.preload = 'auto';
                video.playsInline = true;
                video.controls = true;
                video.className = "elemento-m foto-moment"; // Já deixamos a classe pronta
                
                mediaCache[i] = video; // Salva no cofre

                video.onloadeddata = () => verificarCarregamento();
                video.onerror = () => verificarCarregamento(); 
            } else {
                const img = new Image();
                img.src = momento.midia_url;
                img.className = "elemento-m foto-moment"; // Já deixamos a classe pronta
                img.alt = "Foto do momento";
                
                mediaCache[i] = img; // Salva no cofre

                img.onload = () => verificarCarregamento();
                img.onerror = () => verificarCarregamento(); 
            }
        }

        function verificarCarregamento() {
            carregados++;
            if (carregados === totalParaCarregar) {
                resolve();
            }
        }
    });
}

// Função para buscar dados do banco
async function fetchMomentos() {
    try {
        // Exibe mensagem inicial
        contentContainer.innerHTML = '<h3 class="title-moment-loading">Buscando nossos momentos...</h3>';

        const { data, error } = await supabase
            .from('momentos')
            .select('*')
            .order('data_momento', { ascending: true }); // Traz em ordem cronológica

        if (error) throw error;

        momentos = data;
        
        if (momentos.length > 0) {
            contentContainer.innerHTML = '<h3 class="title-moment-loading">Preparando as fotos e vídeos...</h3>';
            
            // Espera carregar os primeiros 'PRELOAD_AMOUNT' itens na memória do celular
            await preloadMidias(0, PRELOAD_AMOUNT);
            
            // Depois que carregou, renderiza o primeiro momento
            renderMomento(currentIndex);
        } else {
            contentContainer.innerHTML = '<h3 class="title-moment-loading">Nenhum momento cadastrado ainda.</h3>';
        }
    } catch (error) {
        console.error("Erro ao buscar momentos:", error);
        contentContainer.innerHTML = '<h3 class="title-moment-loading">Erro ao carregar os momentos. Tente novamente.</h3>';
    }
}

// Formata a data de YYYY-MM-DD para DD/MM/YYYY
function formatarData(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para renderizar o momento atual na tela
function renderMomento(index) {
    const momento = momentos[index];
    const dataFormatada = formatarData(momento.data_momento);
    
    // Injetamos o HTML sem a mídia, apenas com o container vazio id="media-container"
    contentContainer.innerHTML = `
        <div class="title-moment-content">
            <h3>${dataFormatada} - ${momento.titulo}</h3>
        </div>
        <div class="info-moment" id="media-container">
            <div class="desc-wrapper">
                <p class="moment-description" id="desc-text">${momento.descricao}</p>
                <button class="btn-ler-mais hidden" id="btn-ler-mais">Ler mais...</button>
            </div>
        </div>
    `;

    // Resgata o contêiner e o elemento pré-carregado
    const mediaContainer = document.getElementById('media-container');
    let elementoMidia = mediaCache[index];

    // Fallback de segurança: se por acaso o usuário clicou tão rápido que pulou o cache
    if (!elementoMidia) {
        if (momento.tipo_midia === 'video') {
            elementoMidia = document.createElement('video');
            elementoMidia.src = momento.midia_url;
            elementoMidia.controls = true;
            elementoMidia.playsInline = true;
        } else {
            elementoMidia = new Image();
            elementoMidia.src = momento.midia_url;
            elementoMidia.alt = "Foto do momento";
        }
        elementoMidia.className = "elemento-m foto-moment";
        mediaCache[index] = elementoMidia;
    }

    // Insere o elemento instantaneamente na tela!
    mediaContainer.insertBefore(elementoMidia, mediaContainer.firstChild);

    if (index === 0) {
        btnPrev.style.visibility = 'hidden';
    } else {
        btnPrev.style.visibility = 'visible';
    }

    // LÓGICA DO "LER MAIS"
    setTimeout(() => {
        const descText = document.getElementById('desc-text');
        const btnLerMais = document.getElementById('btn-ler-mais');
        
        if (descText && btnLerMais) {
            if (descText.scrollHeight > descText.clientHeight) {
                descText.classList.add('texto-truncado');
                btnLerMais.classList.remove('hidden');
                
                btnLerMais.addEventListener('click', () => {
                    abrirModal(momento);
                });
            }
        }
    }, 50); 
}           

function changeMomentWithAnimation(direction) {
    // 1. Aplica a animação de SAÍDA (no conteúdo) e a de SCROLL (na linha)
    if (direction === 'next') {
        contentContainer.classList.add('fade-out-left');
        momentLine.classList.add('scroll-line-left'); 
    } else {
        contentContainer.classList.add('fade-out-right');
        momentLine.classList.add('scroll-line-right'); 
    }

    // 2. Espera a saída terminar (400ms)
    setTimeout(() => {
        // Remove as classes de saída apenas do conteúdo
        contentContainer.classList.remove('fade-out-left', 'fade-out-right');

        // Atualiza a tela com o novo momento (agora será instantâneo pois está no cache)
        renderMomento(currentIndex);

        // 3. Aplica a animação de ENTRADA apenas no conteúdo
        if (direction === 'next') {
            contentContainer.classList.add('fade-in-from-right');
        } else {
            contentContainer.classList.add('fade-in-from-left');
        }

        // 4. Limpa as classes depois que a animação acaba (mais 400ms)
        setTimeout(() => {
            contentContainer.classList.remove('fade-in-from-right', 'fade-in-from-left');
            
            // Aqui paramos a animação contínua da linha
            momentLine.classList.remove('scroll-line-left', 'scroll-line-right');
        }, 400);

    }, 400);
}

// Evento: Botão Avançar
btnNext.addEventListener('click', () => {
    if (currentIndex < momentos.length - 1) {
        currentIndex++;
        changeMomentWithAnimation('next');
        
        // PRELOAD SILENCIOSO: Sempre que avançar, tenta carregar imagens futuras para nunca travar
        preloadMidias(currentIndex + PRELOAD_AMOUNT - 1, 2); 

    } else {
        // Transição para a Secção Final (Cronómetro)
        contentContainer.classList.add('fade-out-left');
        
        momentLine.classList.add('fade-out-left'); 
        momentTitle.classList.add('fade-out-left');

        setTimeout(() => {
            momentSection.classList.add('hidden');
            cronometroSection.classList.remove('hidden');
            
            // Removemos as classes de saída para limpar o estado
            contentContainer.classList.remove('fade-out-left');
            momentLine.classList.remove('fade-out-left'); 
            momentTitle.classList.remove('fade-out-left');

            // Aplicamos a animação de entrada no conteúdo do cronómetro
            const finalContent = cronometroSection.querySelector('.cronometro-section');
            if (finalContent) {
                finalContent.classList.add('fade-in-from-right');
                setTimeout(() => {
                    finalContent.classList.remove('fade-in-from-right'); 
                }, 400);
            }
        }, 400);
    }
});

// Evento: Botão Voltar
btnPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
        // Decrementa o index e chama a animação de voltar
        currentIndex--;
        changeMomentWithAnimation('prev');
        
        // Se estiver voltando, também carrega fotos anteriores caso o cache tenha sido limpo
        preloadMidias(Math.max(0, currentIndex - 2), 2);
    }
});

// Evento: Botão Voltar da Tela Final
if (btnVoltarFinal) {
    btnVoltarFinal.addEventListener('click', () => {
        const finalContent = cronometroSection.querySelector('.cronometro-section');
        
        if (finalContent) finalContent.classList.add('fade-out-right');

        setTimeout(() => {
            cronometroSection.classList.add('hidden');
            if (finalContent) finalContent.classList.remove('fade-out-right');
            
            momentSection.classList.remove('hidden');

            contentContainer.classList.add('fade-in-from-left');
            momentLine.classList.add('fade-in-from-left');
            momentTitle.classList.add('fade-in-from-left');

            setTimeout(() => {
                contentContainer.classList.remove('fade-in-from-left');
                momentLine.classList.remove('fade-in-from-left');
                momentTitle.classList.remove('fade-in-from-left');
            }, 400);
        }, 400);
    });
}

// Inicia a busca assim que o script carrega
fetchMomentos();

/* ========================================= */
/* LÓGICA DA MÚSICA DE FUNDO VIA SUPABASE    */
/* ========================================= */

async function carregarMusicaDeFundo() {
    const audioEl = document.getElementById('musica-fundo');
    const btnPlay = document.getElementById('btn-play-musica');

    try {
        const { data, error } = await supabase
            .from('musicas_fundo')
            .select('url_arquivo')
            .eq('selecionada', true)
            .single(); 

        if (error) throw error;

        if (data && data.url_arquivo) {
            audioEl.src = data.url_arquivo; 
            audioEl.volume = 0.5; 

            audioEl.play().then(() => {
                console.log("Música tocando automaticamente!");
            }).catch((erro) => {
                console.log("Navegador bloqueou o autoplay. Exibindo botão para o usuário clicar.");
                btnPlay.style.display = 'flex';
                
                btnPlay.addEventListener('click', () => {
                    audioEl.play();
                    btnPlay.style.display = 'none';
                });
            });
        }
    } catch (err) {
        console.error("Erro ao carregar a música do banco:", err.message);
    }
}

window.addEventListener('DOMContentLoaded', carregarMusicaDeFundo);

/* ========================================= */
/* LÓGICA DO MODAL "LER MAIS"                */
/* ========================================= */

function abrirModal(momento) {
    let midiaHtml = '';
    if (momento.tipo_midia === 'video') {
        midiaHtml = `<video src="${momento.midia_url}" controls preload="auto" playsinline class="modal-midia"></video>`;
    } else {
        midiaHtml = `<img src="${momento.midia_url}" alt="Foto do momento" class="modal-midia">`;
    }
    
    modalBody.innerHTML = `
        ${midiaHtml}
        <p class="modal-descricao">${momento.descricao}</p>
    `;
    
    modal.classList.remove('hidden');
}

// Fechar no X
if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
        modalBody.innerHTML = ''; 
    });
}

// Fechar clicando fora do modal
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { 
            modal.classList.add('hidden');
            modalBody.innerHTML = '';
        }
    });
}
