import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configurações do Supabase (Usando a do util.js original)
const supabaseUrl = 'https://wiagaepfttjhxrsrrwkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYWdhZXBmdHRqaHhyc3Jyd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDM0MjYsImV4cCI6MjA5NTkxOTQyNn0._cqrmHKD-XkEzZ-MNvgCGnFbKmUribBqtI1El0a-9yA';
const supabase = createClient(supabaseUrl, supabaseKey);

/* ==============================================================
   ÁREA ADMINISTRATIVA (LOGIN E GERENCIAMENTO)
============================================================== */
const ADMIN_USER = 'J.J';
const ADMIN_PASS = '1234';

// Botões do Menu
const btnConfig = document.getElementById('btn-nav-config');
const btnCd = document.getElementById('btn-nav-musica');

// Modais
const modalLogin = document.getElementById('login-modal');
const modalMusica = document.getElementById('musica-modal');
const modalConfig = document.getElementById('config-modal');
const modalAddMusica = document.getElementById('add-musica-modal');
const modalEdit = document.getElementById('edit-momento-modal');

let acaoPendente = null; 

// Verifica se já está logado para aplicar estilos visuais (opcional no menu)
function atualizarVisualBotoes() {
    const isAdmin = localStorage.getItem('isAdminCasal') === 'true';
    if (btnConfig && btnCd) {
        if (!isAdmin) {
            btnConfig.classList.add('btn-bloqueado');
            btnCd.classList.add('btn-bloqueado');
        } else {
            btnConfig.classList.remove('btn-bloqueado');
            btnCd.classList.remove('btn-bloqueado');
        }
    }
    return isAdmin;
}
atualizarVisualBotoes();

// Clique em Gerenciar Momentos no Menu
if (btnConfig) {
    btnConfig.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que a página role para o topo
        if (atualizarVisualBotoes()) {
            abrirConfiguracoes(); 
        } else {
            acaoPendente = 'config';
            if (modalLogin) modalLogin.classList.remove('hidden');
        }
    });
}

// Clique em Música de Fundo no Menu
if (btnCd) {
    btnCd.addEventListener('click', (e) => {
        e.preventDefault();
        if (atualizarVisualBotoes()) {
            abrirMusicas();
        } else {
            acaoPendente = 'musica';
            if (modalLogin) modalLogin.classList.remove('hidden');
        }
    });
}

// Lógica do Login
const btnLogin = document.getElementById('btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        const erroMsg = document.getElementById('login-erro');

        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            localStorage.setItem('isAdminCasal', 'true');
            erroMsg.style.display = 'none';
            modalLogin.classList.add('hidden');
            atualizarVisualBotoes();
            
            if (acaoPendente === 'config') abrirConfiguracoes();
            if (acaoPendente === 'musica') abrirMusicas();
            acaoPendente = null;
        } else {
            erroMsg.style.display = 'block';
        }
    });
}

// Fechar modais de login e áreas principais
if (document.getElementById('close-login')) document.getElementById('close-login').addEventListener('click', () => modalLogin.classList.add('hidden'));
if (document.getElementById('close-musica')) document.getElementById('close-musica').addEventListener('click', () => modalMusica.classList.add('hidden'));
if (document.getElementById('close-config')) document.getElementById('close-config').addEventListener('click', () => modalConfig.classList.add('hidden'));


/* ==============================================================
   LÓGICA DAS MÚSICAS (Mantida e adaptada)
============================================================== */
if (document.getElementById('btn-abrir-add')) {
    document.getElementById('btn-abrir-add').addEventListener('click', () => modalAddMusica.classList.remove('hidden'));
}
if (document.getElementById('close-add-musica')) {
    document.getElementById('close-add-musica').addEventListener('click', () => {
        modalAddMusica.classList.add('hidden');
        document.getElementById('upload-status').innerText = ""; 
    });
}

function abrirMusicas() {
    if(modalMusica) modalMusica.classList.remove('hidden');
    carregarListaMusicas();
}

async function carregarListaMusicas() {
    const listaContainer = document.getElementById('lista-musicas');
    const inputBusca = document.getElementById('busca-musica');
    if(!listaContainer) return;

    listaContainer.innerHTML = '<p>Carregando músicas...</p>';
    if (inputBusca) inputBusca.value = ''; 

    try {
        const { data, error } = await supabase.from('musicas_fundo').select('*');
        if (error) throw error;

        if (data.length === 0) {
            listaContainer.innerHTML = '<p>Nenhuma música cadastrada.</p>';
            return;
        }

        data.sort((a, b) => {
            if (a.selecionada && !b.selecionada) return -1;
            if (!a.selecionada && b.selecionada) return 1;
            return a.nome.localeCompare(b.nome);
        });

        listaContainer.innerHTML = data.map(musica => `
            <div class="musica-item ${musica.selecionada ? 'ativa' : ''}">
                <div class="musica-info">
                    <span class="musica-nome">${musica.nome}</span>
                    ${musica.selecionada ? '<span class="musica-status">Tocando agora 🎵</span>' : ''}
                </div>
                <div class="musica-acoes">
                    ${!musica.selecionada ? `<button class="btn-acao-musica btn-selecionar" onclick="selecionarMusica(${musica.id})" title="Tocar esta"><i class="ri-play-circle-line"></i></button>` : ''}
                    <button class="btn-acao-musica btn-excluir" onclick="excluirMusica(${musica.id}, '${musica.url_arquivo}')" title="Excluir"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Erro ao carregar músicas:", err);
        listaContainer.innerHTML = '<p style="color: red;">Erro ao carregar lista.</p>';
    }
}

if (document.getElementById('busca-musica')) {
    document.getElementById('busca-musica').addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const itens = document.querySelectorAll('.musica-item');
        itens.forEach(item => {
            const nomeMusica = item.querySelector('.musica-nome').innerText.toLowerCase();
            item.style.display = nomeMusica.includes(termo) ? 'flex' : 'none';
        });
    });
}

if (document.getElementById('btn-upload-musica')) {
    document.getElementById('btn-upload-musica').addEventListener('click', async () => {
        const nomeInput = document.getElementById('nome-musica');
        const arquivoInput = document.getElementById('arquivo-musica');
        const statusText = document.getElementById('upload-status');

        const nome = nomeInput.value.trim();
        const arquivo = arquivoInput.files[0];

        if (!nome || !arquivo) {
            statusText.innerText = "Preencha o nome e selecione um arquivo MP3!";
            return;
        }

        statusText.innerText = "Enviando... Aguarde ⏳";
        
        try {
            const fileExt = arquivo.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('Musicas').upload(fileName, arquivo);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('Musicas').getPublicUrl(fileName);
            const { error: dbError } = await supabase.from('musicas_fundo').insert([
                { nome: nome, url_arquivo: urlData.publicUrl, selecionada: false }
            ]);

            if (dbError) throw dbError;

            statusText.innerText = "Música adicionada com sucesso! ✨";
            nomeInput.value = ''; arquivoInput.value = '';
            carregarListaMusicas();

            setTimeout(() => { 
                statusText.innerText = ""; 
                modalAddMusica.classList.add('hidden');
            }, 2000);

        } catch (err) {
            console.error("Erro no upload:", err);
            statusText.innerText = "Erro ao enviar música. Tente de novo.";
        }
    });
}

function mostrarConfirmacao(titulo, mensagem) {
    return new Promise((resolve) => {
        const modalConf = document.getElementById('confirmacao-modal');
        if(!modalConf) return resolve(false);

        document.getElementById('confirmacao-titulo').innerText = titulo;
        document.getElementById('confirmacao-mensagem').innerText = mensagem;
        modalConf.classList.remove('hidden');

        const btnSim = document.getElementById('btn-confirmar-sim');
        const btnNao = document.getElementById('btn-confirmar-nao');

        const limparEventos = () => {
            btnSim.replaceWith(btnSim.cloneNode(true));
            btnNao.replaceWith(btnNao.cloneNode(true));
            modalConf.classList.add('hidden');
        };

        document.getElementById('btn-confirmar-sim').addEventListener('click', () => { limparEventos(); resolve(true); }, { once: true });
        document.getElementById('btn-confirmar-nao').addEventListener('click', () => { limparEventos(); resolve(false); }, { once: true });
    });
}

window.selecionarMusica = async function(id) {
    const confirmado = await mostrarConfirmacao("Trocar Música", "Deseja definir esta música como a trilha sonora principal?");
    if (!confirmado) return;
    try {
        await supabase.from('musicas_fundo').update({ selecionada: false }).neq('id', 0);
        await supabase.from('musicas_fundo').update({ selecionada: true }).eq('id', id);
        carregarListaMusicas();
    } catch (err) { console.error(err); mostrarToast("Erro ao alterar a música."); }
}

window.excluirMusica = async function(id, url_arquivo) {
    const confirmado = await mostrarConfirmacao("Excluir Música", "Tem certeza que deseja apagar essa música do nosso acervo?");
    if (!confirmado) return;
    try {
        await supabase.from('musicas_fundo').delete().eq('id', id);
        const fileName = url_arquivo.split('/').pop();
        await supabase.storage.from('Musicas').remove([fileName]);
        carregarListaMusicas();
    } catch (err) { console.error(err); mostrarToast("Erro ao excluir a música."); }
}

/* ==============================================================
   LÓGICA DOS MOMENTOS (Mantida e adaptada)
============================================================== */
let momentoSendoEditado = null; 

function abrirConfiguracoes() {
    if(modalConfig) modalConfig.classList.remove('hidden');
    carregarMomentosGrid();
}

async function carregarMomentosGrid() {
    const grid = document.getElementById('momentos-grid');
    if(!grid) return;
    grid.innerHTML = '<p>Carregando...</p>';

    try {
        const { data, error } = await supabase.from('momentos').select('*').order('id', { ascending: false });
        if (error) throw error;

        grid.innerHTML = data.map(m => `
            <div class="momento-card">
                <img src="${m.midia_url}" onerror="this.src='https://via.placeholder.com/150?text=Erro+Imagem'">
                <div class="momento-card-info">${m.titulo}</div>
                <div class="momento-card-acoes">
                    <button class="btn-edit-card" onclick='abrirEditor(${JSON.stringify(m)})'><i class="ri-edit-box-line"></i></button>
                    <button class="btn-del-card" onclick="excluirMomento(${m.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) { grid.innerHTML = '<p>Erro ao carregar.</p>'; }
}

if (document.getElementById('busca-momento')) {
    document.getElementById('busca-momento').addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        document.querySelectorAll('.momento-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(termo) ? 'flex' : 'none';
        });
    });
}

window.abrirEditor = function(momento = null) {
    momentoSendoEditado = momento; 
    const tituloModal = document.getElementById('titulo-form-momento');
    const inputTitulo = document.getElementById('edit-titulo');
    const inputData = document.getElementById('edit-data');
    const inputDesc = document.getElementById('edit-desc');
    const preview = document.getElementById('edit-preview-img');

    if (momento) {
        tituloModal.innerText = "Editar Momento";
        inputTitulo.value = momento.titulo; inputData.value = momento.data_momento;
        preview.src = momento.midia_url;
    } else {
        tituloModal.innerText = "Novo Momento";
        inputTitulo.value = ""; inputData.value = "";
        inputDesc.value = "";
        preview.src = "https://via.placeholder.com/300x200?text=Preview+da+Foto";
    }
    if(modalEdit) modalEdit.classList.remove('hidden');
};

// Adicione isso para atualizar o preview com o arquivo local escolhido
if (document.getElementById('arquivo-foto')) {
    document.getElementById('arquivo-foto').addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        if (arquivo) {
            const preview = document.getElementById('edit-preview-img');
            if (arquivo.type.includes('video')) {
                preview.src = "https://via.placeholder.com/300x200?text=Vídeo+Selecionado+🎥";
            } else {
                preview.src = URL.createObjectURL(arquivo);
            }
        }
    });
}

const fecharEditor = () => { if(modalEdit) modalEdit.classList.add('hidden') };
if(document.getElementById('btn-voltar-edit')) document.getElementById('btn-voltar-edit').addEventListener('click', fecharEditor);
if(document.getElementById('btn-cancelar-edit')) {
    document.getElementById('btn-cancelar-edit').addEventListener('click', async () => {
        if (await mostrarConfirmacao("Descartar?", "Deseja cancelar as alterações feitas?")) fecharEditor();
    });
}
if(document.getElementById('btn-abrir-add-momento')) document.getElementById('btn-abrir-add-momento').addEventListener('click', () => abrirEditor(null));

if (document.getElementById('btn-salvar-momento')) {
    document.getElementById('btn-salvar-momento').addEventListener('click', async () => {
        const tituloMomento = document.getElementById('edit-titulo').value.trim();
        const dataMomento = document.getElementById('edit-data').value;
        const desc = document.getElementById('edit-desc').value.trim();
        
        let urlFinal = momentoSendoEditado ? momentoSendoEditado.midia_url : ''; // Se for edição, mantém a URL antiga caso não envie um novo arquivo
        const arquivoInput = document.getElementById('arquivo-foto');
        const btnSalvar = document.getElementById('btn-salvar-momento');

        // Validação básica de texto
        if (!tituloMomento || !dataMomento || !desc) {
            return mostrarToast("Preencha título, data e descrição!");
        }

        // Se for um novo momento (não tem momentoSendoEditado) e não selecionou arquivo, barra o envio
        if (!momentoSendoEditado && (!arquivoInput || arquivoInput.files.length === 0)) {
            return mostrarToast("Você precisa selecionar um arquivo de foto ou vídeo!");
        }

        try {
            btnSalvar.innerText = "Salvando... ⏳";
            btnSalvar.disabled = true;

            let tipoMidia = momentoSendoEditado ? momentoSendoEditado.tipo_midia : 'foto';

            // SE TIVER UM ARQUIVO NOVO SELECIONADO, FAZ O UPLOAD
            if (arquivoInput && arquivoInput.files.length > 0) {
                const arquivo = arquivoInput.files[0];
                const fileExt = arquivo.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                tipoMidia = arquivo.type.includes('video') ? 'video' : 'foto';

                const { error: uploadError } = await supabase.storage
                    .from('Momentos')
                    .upload(fileName, arquivo);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('Momentos')
                    .getPublicUrl(fileName);
                
                urlFinal = urlData.publicUrl; 
            } 

            // SALVA NO BANCO DE DADOS
            if (momentoSendoEditado) {
                await supabase.from('momentos').update({ 
                    titulo: tituloMomento, 
                    data_momento: dataMomento, 
                    midia_url: urlFinal, 
                    descricao: desc, 
                    tipo_midia: tipoMidia 
                }).eq('id', momentoSendoEditado.id);
            } else {
                await supabase.from('momentos').insert([{ 
                    titulo: tituloMomento, 
                    data_momento: dataMomento, 
                    midia_url: urlFinal, 
                    descricao: desc, 
                    tipo_midia: tipoMidia 
                }]);
            }
            
            fecharEditor();
            carregarMomentosGrid(); 
            
        } catch (err) { 
            console.error(err); 
            mostrarToast("Erro ao salvar momento. Verifique o console."); 
        } finally {
            btnSalvar.innerText = "Salvar Momento";
            btnSalvar.disabled = false;
            if (arquivoInput) arquivoInput.value = ''; 
        }
    });
}

window.excluirMomento = async function(id) {
    if (!await mostrarConfirmacao("Apagar Momento", "Tem certeza? Essa lembrança sumirá da nossa linha do tempo!")) return;
    try {
        await supabase.from('momentos').delete().eq('id', id);
        carregarMomentosGrid();
    } catch (err) { mostrarToast("Erro ao excluir."); }
}

/* ==============================================================
   SISTEMA DE NOTIFICAÇÕES (TOAST)
============================================================== */
function mostrarToast(mensagem, tipo = 'error') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    // Define o ícone com base no tipo usando o Remix Icon
    let icone = 'ri-error-warning-line';
    if (tipo === 'warning') icone = 'ri-alert-line';
    if (tipo === 'success') icone = 'ri-checkbox-circle-line';

    toast.innerHTML = `<i class="${icone}" style="font-size: 1.5rem;"></i> <span>${mensagem}</span>`;

    container.appendChild(toast);

    // Remove o toast suavemente após 3.5 segundos
    setTimeout(() => {
        toast.classList.add('toast-hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3500);
}