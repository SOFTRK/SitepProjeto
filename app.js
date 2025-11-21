// =====================================================
//   APP.JS - Versão Final Minimalista
//   - Integra todas as páginas.
//   - LocalStorage para dados.
//   - Cumpre todos os RF e RNF.
//   - Documentação integrada nos comentários.
//   =====================================================

// Documentação de Requisitos e Especificações (como fornecido):
// 1. Objetivo: Site de receitas para visualizar, pesquisar, adicionar e denunciar receitas, com autenticação.
// 2. Requisitos Funcionais:
//   RF01 – Home com receitas destaque, busca, botões seções.
//   RF02 – Lista de receitas com nome, desc, clique para detalhes.
//   RF03 – Busca por nome, ingrediente, categoria.
//   RF04 – Detalhes com ingredientes, preparo, autor, botão denunciar.
//   RF05 – Denunciar com motivo.
//   RF06 – Cadastro/login com nome, email, senha.
//   RF07 – Perfil com info usuário, receitas criadas.
//   RF08 – Adicionar receita com título, desc, ingredientes, preparo, imagem opcional.
// 3. Requisitos Não Funcionais:
//   RNF01 – Responsiva (desktop/mobile).
//   RNF02 – Layout simples/intuitivo.
// 4. Entregas: Protótipo, código comentado, doc com uso (este comentário + PDF link).

(() => {
  // Link para PDF de documentação (ajuste se necessário)
  const DOC_URL = '/mnt/data/Documentação Site de Receitas.pdf';

  // Chaves LocalStorage
  const KEY_USERS = 'cf_users_v1';
  const KEY_RECIPES = 'cf_recipes_v1';
  const KEY_LOGGED = 'cf_logged_v1';
  const KEY_FAVS = 'cf_favs_v1';
  const KEY_DENUNCIAS = 'cf_denuncias_v1';

  // DB in-memory
  const DB = {
    users: JSON.parse(localStorage.getItem(KEY_USERS) || '[]'),
    recipes: JSON.parse(localStorage.getItem(KEY_RECIPES) || '[]'),
    logged: JSON.parse(localStorage.getItem(KEY_LOGGED) || 'null'),
    favs: JSON.parse(localStorage.getItem(KEY_FAVS) || '[]'),
    denuncias: JSON.parse(localStorage.getItem(KEY_DENUNCIAS) || '[]')
  };

  // Salvar DB
  function save() {
    localStorage.setItem(KEY_USERS, JSON.stringify(DB.users));
    localStorage.setItem(KEY_RECIPES, JSON.stringify(DB.recipes));
    localStorage.setItem(KEY_LOGGED, JSON.stringify(DB.logged));
    localStorage.setItem(KEY_FAVS, JSON.stringify(DB.favs));
    localStorage.setItem(KEY_DENUNCIAS, JSON.stringify(DB.denuncias));
  }

  // Gerar ID
  function uid() { return Date.now() + Math.floor(Math.random() * 999); }

  // Dados iniciais (seed) se vazio (RF02, RF04)
  if (DB.recipes.length === 0) {
    DB.recipes = [
      { id: uid(), titulo: 'Bolo de Chocolate Simples', categoria: 'Sobremesa', desc: 'Bolo fofinho e fácil.', ingredientes: '2 ovos,1 xícara açúcar,1/2 xícara óleo,1 xícara leite,1 xícara farinha,1/2 xícara cacau,1 colher fermento', preparo: 'Bater líquidos;Misturar secos;Assar 30-35 min', imagem: 'imagens/bolo-chocolate.png', autor: 'Admin', userId: null },
      { id: uid(), titulo: 'Salada Mediterrânea', categoria: 'Entrada', desc: 'Fresca com tomates, pepino e queijo.', ingredientes: 'Tomate-cereja,Pepino,Azeitonas,Queijo feta,Azeite,Orégano', preparo: 'Cortar vegetais;Misturar tudo;Temperar', imagem: 'imagens/salada-mediterranea.png', autor: 'Admin', userId: null },
      { id: uid(), titulo: 'Macarrão Alho e Óleo', categoria: 'Principal', desc: 'Rápido, simples e saboroso.', ingredientes: '250g macarrão,3 dentes alho,Azeite,Salsinha,Sal', preparo: 'Cozinhar macarrão;Refogar alho;Misturar e servir', imagem: 'imagens/macarrao-alho-oleo.png', autor: 'Admin', userId: null }
    ];
    save();
  }

  // Auth (RF06)
  function register(nome, email, senha) {
    email = (email || '').toLowerCase().trim();
    if (!nome || !email || !senha) return { ok: false, msg: 'Preencha todos os campos.' };
    if (DB.users.some(u => u.email === email)) return { ok: false, msg: 'E-mail já cadastrado.' };
    const user = { id: uid(), nome, email, senha };
    DB.users.push(user); save();
    return { ok: true, msg: 'Cadastro realizado com sucesso.' };
  }

  function login(email, senha) {
    email = (email || '').toLowerCase().trim();
    const user = DB.users.find(u => u.email === email && u.senha === senha);
    if (!user) return { ok: false, msg: 'Credenciais inválidas.' };
    DB.logged = user; save();
    return { ok: true, msg: 'Autenticado.' };
  }

  function logout() { DB.logged = null; save(); }

  function currentUser() { return DB.logged; }

  // Receitas (RF08, RF02, RF04)
  function addRecipe({ titulo, desc, categoria, ingredientes, preparo, imagem }) {
    if (!DB.logged) return { ok: false, msg: 'Faça login para adicionar receita.' };
    if (!titulo || !desc || !ingredientes || !preparo) return { ok: false, msg: 'Campos obrigatórios faltando.' };
    const r = { id: uid(), titulo, desc, categoria: categoria || 'Outros', ingredientes, preparo, imagem: imagem || 'imagens/placeholder.png', autor: DB.logged.nome, userId: DB.logged.id };
    DB.recipes.unshift(r); save();
    return { ok: true, msg: 'Receita adicionada.', recipe: r };
  }

  function listRecipes() { return DB.recipes.slice(); }

  function findRecipe(id) { return DB.recipes.find(r => String(r.id) === String(id)); }

  // Busca (RF03)
  function searchRecipes(term) {
    if (!term) return listRecipes();
    term = term.toLowerCase();
    return DB.recipes.filter(r => (r.titulo + ' ' + r.desc + ' ' + r.ingredientes + ' ' + (r.categoria || '')).toLowerCase().includes(term));
  }

  // Denúncias (RF05)
  function fileDenuncia(idReceita, motivo) {
    const r = findRecipe(idReceita);
    if (!r) return { ok: false, msg: 'Receita não encontrada.' };
    const d = { id: uid(), receitaId: r.id, motivo: motivo || 'Não informado', data: new Date().toISOString() };
    DB.denuncias.push(d); save();
    console.log('Denúncia registrada:', d);
    return { ok: true, msg: 'Denúncia enviada.' };
  }

  // Proteção de rotas (para páginas que precisam login)
  function ensureAuth(redirectTo = 'login.html') {
    if (!DB.logged) { window.location.href = redirectTo; return false; }
    return true;
  }

  // DOM Loaded (integração com páginas)
  document.addEventListener('DOMContentLoaded', () => {
    // Link doc
    document.querySelectorAll('[data-doc-link]').forEach(el => el.href = DOC_URL);

    // Home / Lista (RF01, RF02, RF03)
    const lista = document.getElementById('listaReceitas') || document.getElementById('listaCompleta');
    const busca = document.getElementById('busca') || document.getElementById('buscaReceitas');
    if (lista) {
      function renderCards(items) {
        lista.innerHTML = '';
        if (items.length === 0) { lista.innerHTML = '<p class="center small">Nenhuma receita encontrada.</p>'; return; }
        items.forEach(r => {
          const html = `
            <div class="card">
              ${r.imagem ? `<img src="${r.imagem}" alt="${r.titulo}">` : '<div class="img-placeholder">Imagem</div>'}
              <div class="card-content">
                <h3>${r.titulo}</h3>
                <p>${r.desc}</p>
                <div class="meta">
                  <span class="tag">${r.categoria || '—'}</span>
                  <a class="cta" href="receita.html?id=${r.id}">Ver detalhes</a>
                </div>
              </div>
            </div>`;
          lista.insertAdjacentHTML('beforeend', html);
        });
      }
      renderCards(listRecipes());
      if (busca) busca.addEventListener('input', e => renderCards(searchRecipes(e.target.value)));
    }

    // Login (RF06)
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('emailLogin').value.trim();
        const senha = document.getElementById('senhaLogin').value;
        const res = login(email, senha);
        if (!res.ok) { alert(res.msg); return; }
        window.location.href = 'perfil.html';
      });
    }

    // Cadastro (RF06)
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
      formCadastro.addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('nomeCadastro').value;
        const email = document.getElementById('emailCadastro').value.trim();
        const senha = document.getElementById('senhaCadastro').value;
        const res = register(nome, email, senha);
        if (!res.ok) { alert(res.msg); return; }
        alert('Cadastro concluído! Faça login.');
        window.location.href = 'login.html';
      });
    }

    // Perfil (RF07)
    const perfilContainer = document.getElementById('perfilContainer');
    if (perfilContainer) {
      if (!ensureAuth()) return;
      const minhas = DB.recipes.filter(r => r.userId === DB.logged.id);
      perfilContainer.innerHTML = `
        <div class='profile-header'>
          <div class='avatar'>${(DB.logged.nome || 'U').slice(0, 1).toUpperCase()}</div>
          <div class='profile-info'>
            <h2>${DB.logged.nome}</h2>
            <p class='small'>${DB.logged.email}</p>
          </div>
        </div>
        <section class='my-recipes'>
          <h3>Minhas receitas</h3>
          <div class='grid'>${minhas.length === 0 ? '<p class="small">Você ainda não adicionou receitas.</p>' : minhas.map(r => `<div class="card"><img src="${r.imagem}"><div class="card-content"><h3>${r.titulo}</h3><p>${r.desc}</p><a class="cta" href="receita.html?id=${r.id}">Ver</a></div></div>`).join('')}</div>
        </section>
        <button id='logoutBtn'>Sair</button>`;
      document.getElementById('logoutBtn').addEventListener('click', () => { logout(); window.location.href = 'index.html'; });
    }

    // Detalhes Receita (RF04)
    const detalhesContainer = document.getElementById('detalhesContainer');
    if (detalhesContainer) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const r = findRecipe(id);
      if (!r) { detalhesContainer.innerHTML = '<p>Receita não encontrada.</p>'; return; }
      detalhesContainer.innerHTML = `
        <img src="${r.imagem}" alt="${r.titulo}">
        <div class='recipe-body'>
          <h2>${r.titulo}</h2>
          <p class='small'>Categoria: ${r.categoria || '—'} • Autor: ${r.autor || '—'}</p>
          <p>${r.desc}</p>
          <div class='recipe-section'>
            <h3>Ingredientes</h3>
            <ul>${r.ingredientes.split(',').map(i => `<li>${i.trim()}</li>`).join('')}</ul>
          </div>
          <div class='recipe-section'>
            <h3>Modo de Preparo</h3>
            <ol>${r.preparo.split(';').map(s => `<li>${s.trim()}</li>`).join('')}</ol>
          </div>
          <div class='recipe-meta'>
            <a class='report-btn' href='denuncia.html?id=${r.id}'>Denunciar receita</a>
          </div>
        </div>`;
    }

    // Nova Receita (RF08)
    const formNova = document.getElementById('formNovaReceita');
    if (formNova) {
      if (!ensureAuth()) return;
      formNova.addEventListener('submit', e => {
        e.preventDefault();
        const titulo = document.getElementById('tituloReceita').value.trim();
        const desc = document.getElementById('descricaoReceita').value.trim();
        const categoria = document.getElementById('categoriaReceita').value.trim();
        const ingredientes = document.getElementById('ingredientesReceita').value.trim();
        const preparo = document.getElementById('preparoReceita').value.trim();
        const imagem = document.getElementById('imagemReceita').value.trim();
        const res = addRecipe({ titulo, desc, categoria, ingredientes, preparo, imagem });
        if (!res.ok) { alert(res.msg); return; }
        alert('Receita criada!');
        window.location.href = 'receitas.html';
      });
    }

    // Denúncia (RF05)
    const formDen = document.getElementById('formDenuncia');
    if (formDen) {
      const params = new URLSearchParams(window.location.search);
      const idRec = params.get('id');
      formDen.addEventListener('submit', e => {
        e.preventDefault();
        const motivo = document.getElementById('motivoDenuncia').value.trim();
        const res = fileDenuncia(idRec, motivo);
        alert(res.msg);
        window.location.href = 'receita.html?id=' + idRec;
      });
    }
  });

  // API pública para scripts inline (compatibilidade com seu código original)
  window.app = {
    cadastrar: register,
    login,
    logout,
    obterPerfil: currentUser,
    adicionarReceita: addRecipe,
    listarReceitas: listRecipes,
    obterReceita: findRecipe,
    buscarReceitas: searchRecipes,
    denunciarReceita: fileDenuncia
  };
})();