/* Albor América · comportamento da página
   HTML, CSS e JS puros. GSAP, ScrollTrigger e Lenis vêm por CDN
   (index.html), sem instalar nada. */

(() => {
  'use strict';

  // Número do WhatsApp do treino (o P&D informa antes do encontro 1).
  // Por enquanto o botão "Falar no WhatsApp" é só visual e não faz nada.
  const WHATSAPP_NUMERO = '';

  /* ---------- A subida: ajustes fáceis ---------- */

  // Distância de rolagem por imagem. As imagens da subida são poucas e
  // diferentes entre si (fusão suave, não quadro a quadro), então cada
  // uma pede bem mais que os ~20 px de uma sequência de vídeo.
  const PX_POR_IMAGEM = 560;
  // Trecho extra no fim, em frações de imagem, para a última aparecer
  // inteira mesmo com scroll rápido.
  const SEGURA_FIM = 0.6;
  // Suavização do scrub do ScrollTrigger (segundos).
  const SCRUB = 0.5;

  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Scroll suave (Lenis) sincronizado com o ScrollTrigger ---------- */

  let lenis = null;
  if (temGsap) {
    gsap.registerPlugin(ScrollTrigger);
    // a barra de endereço do celular muda a altura da tela: não recalcula tudo por isso
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  if (temGsap && window.Lenis && !movimentoReduzido) {
    // lerp mais alto = rolagem mais responsiva (0.1 dava sensação de "arrastar")
    lenis = new Lenis({ lerp: 0.16, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
    gsap.ticker.lagSmoothing(0);
    // a página cresce quando o GSAP cria o espaço da seção travada:
    // o Lenis precisa reler a altura, senão limita a rolagem ao tamanho antigo
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  }
  const travaScroll = (travar) => {
    document.body.classList.toggle('travado', travar);
    if (lenis) travar ? lenis.stop() : lenis.start();
  };

  /* ---------- 1. Topo fixo ---------- */

  const topo = document.querySelector('[data-topo]');
  const menuBotao = document.querySelector('[data-menu-botao]');
  const menu = document.getElementById('menu');
  const telaLarga = window.matchMedia('(min-width: 900px)');

  const atualizaTopo = () => {
    topo.classList.toggle('topo--solido', window.scrollY > 24);
  };
  let topoAgendado = false;
  window.addEventListener('scroll', () => {
    if (topoAgendado) return;
    topoAgendado = true;
    requestAnimationFrame(() => { atualizaTopo(); topoAgendado = false; });
  }, { passive: true });
  atualizaTopo();

  const abreMenu = (abrir) => {
    topo.classList.toggle('topo--menu', abrir);
    menuBotao.setAttribute('aria-expanded', String(abrir));
    menuBotao.querySelector('.sr').textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    travaScroll(abrir);
    if (abrir) menu.querySelector('a').focus();
  };

  menuBotao.addEventListener('click', () => {
    abreMenu(!topo.classList.contains('topo--menu'));
  });

  // Qualquer link do topo fecha o menu do celular
  topo.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (topo.classList.contains('topo--menu')) abreMenu(false);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && topo.classList.contains('topo--menu')) {
      abreMenu(false);
      menuBotao.focus();
    }
  });

  telaLarga.addEventListener('change', (e) => {
    if (e.matches && topo.classList.contains('topo--menu')) abreMenu(false);
  });

  // Com o Lenis, os links internos rolam suave. A parada logo abaixo do topo
  // vem do scroll-margin-top do CSS, que o Lenis já respeita.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || !lenis) return;
    const alvo = document.querySelector(link.hash);
    if (!alvo) return;
    e.preventDefault();
    lenis.resize();
    lenis.scrollTo(alvo, { duration: 1.4 });
  });

  // Marca no menu a seção que está na tela
  const linksMenu = [...menu.querySelectorAll('a')];
  const secoesMenu = linksMenu.map((a) => document.querySelector(a.hash));
  const observaSecoes = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      linksMenu.forEach((a) => {
        if (a.hash === '#' + entrada.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secoesMenu.forEach((s) => s && observaSecoes.observe(s));

  /* ---------- 3. A torre dos diferenciais ---------- */

  const secaoDiferenciais = document.getElementById('diferenciais');

  const cartoes = [...document.querySelectorAll('.cartao')];
  let andarPorMouse = null;
  let andarPorRolagem = null;
  const aplicaAndar = () => {
    const andar = andarPorMouse || andarPorRolagem;
    if (andar) secaoDiferenciais.dataset.andarAtivo = andar;
    else delete secaoDiferenciais.dataset.andarAtivo;
  };

  cartoes.forEach((cartao) => {
    cartao.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      andarPorMouse = cartao.dataset.andar;
      aplicaAndar();
    });
    cartao.addEventListener('pointerleave', () => {
      andarPorMouse = null;
      aplicaAndar();
    });
  });

  const observaCartoes = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) andarPorRolagem = entrada.target.dataset.andar;
    });
    aplicaAndar();
  }, { rootMargin: '-48% 0px -48% 0px' });
  cartoes.forEach((c) => observaCartoes.observe(c));

  new IntersectionObserver((entradas) => {
    if (!entradas[0].isIntersecting) { andarPorRolagem = null; aplicaAndar(); }
  }).observe(secaoDiferenciais);

  /* ---------- 3b. A subida: imagens presas ao scroll ---------- */

  const jornada = document.querySelector('[data-jornada]');
  if (jornada) iniciaJornada();

  function iniciaJornada() {
    const ordem = new Intl.Collator('pt-BR', { numeric: true });
    // fx: onde está o centro de interesse na largura da imagem (0 a 1),
    // usado no corte tipo "cover" quando a tela é mais estreita que a foto.
    const CENAS = [
      { arq: 'albor_jornada_01', andar: 0,  fx: 0.42, nome: 'Recepção',             linha: 'A chegada, com jardim interno e luz natural.' },
      { arq: 'albor_jornada_02', andar: 0,  fx: 0.5,  nome: 'Albor Market',         linha: 'O minimercado do prédio, no caminho de casa.' },
      { arq: 'albor_jornada_03', andar: 2,  fx: 0.42, nome: 'Piscina lounge',       linha: 'A piscina com a cidade inteira no horizonte.' },
      { arq: 'albor_jornada_04', andar: 2,  fx: 0.42, nome: 'Piscina lounge',       linha: 'O mesmo deck, quando o sol começa a baixar.' },
      { arq: 'albor_jornada_05', andar: 2,  fx: 0.55, nome: 'Quadra poliesportiva', linha: 'A quadra no fim da tarde.' },
      { arq: 'albor_jornada_06', andar: 24, fx: 0.45, nome: 'Albor Gym',            linha: 'Treino com o pôr do sol pela janela.' },
      { arq: 'albor_jornada_07', andar: 24, fx: 0.5,  nome: 'Fire lounge',          linha: 'A lareira acesa no alto da torre.' },
      { arq: 'albor_jornada_08', andar: 24, fx: 0.5,  nome: 'Fire lounge',          linha: 'E a noite chega ao rooftop.' },
    ].sort((a, b) => ordem.compare(a.arq, b.arq)); // 2 vem antes de 10

    const total = CENAS.length;
    const palco = jornada.querySelector('[data-jornada-palco]');
    const tela = jornada.querySelector('[data-jornada-tela]');
    const painel = jornada.querySelector('[data-jornada-painel]');
    const elNum = jornada.querySelector('[data-jornada-andar]');
    const elZona = jornada.querySelector('[data-jornada-zona]');
    const elPavimento = jornada.querySelector('[data-jornada-pavimento]');
    const elNome = jornada.querySelector('[data-jornada-nome]');
    const elLinha = jornada.querySelector('[data-jornada-linha]');
    const elContagem = jornada.querySelector('[data-jornada-contagem]');
    const elevador = jornada.querySelector('[data-jornada-elevador]');

    const mostraTextos = (k) => {
      elNome.textContent = CENAS[k].nome;
      elLinha.textContent = CENAS[k].linha;
      elContagem.textContent = `${k + 1} de ${total}`;
    };

    // As três paradas do elevador, com a mesma regra de nomes da seção:
    // a zona em destaque, o pavimento embaixo.
    const PARADAS_NOMES = {
      0:  { num: 'T',   zona: 'Térreo',  pavimento: 'Recepção e Albor Market', acesa: 'terreo' },
      2:  { num: '2º',  zona: 'Lazer',   pavimento: '2º sobressolo',           acesa: 'sobressolo' },
      24: { num: '24º', zona: 'Rooftop', pavimento: '24º pavimento',           acesa: 'rooftop' },
    };
    let sentido = 1;          // 1 subindo, -1 descendo
    let valorAnterior = null;
    let paradaAnterior = null;

    // Entre as paradas o painel vira o mostrador do elevador:
    // o número conta os pavimentos e a linha de baixo diz para onde ele vai.
    const rotuloDoAndar = (v) => {
      if (PARADAS_NOMES[v]) return PARADAS_NOMES[v];
      const destino = sentido > 0 ? (v < 2 ? 'Lazer' : 'Rooftop') : (v > 2 ? 'Lazer' : 'Térreo');
      return {
        num: v === 1 ? '1º' : `${v}º`,
        zona: sentido > 0 ? 'Subindo' : 'Descendo',
        pavimento: `Próxima parada: ${destino}`,
        acesa: sentido > 0 ? 'subindo' : 'descendo',
      };
    };

    // Altura da cabine no desenho do prédio (coordenada y do símbolo, de 0 a 300),
    // casada com o desenho: térreo, deck de lazer, os 20 pavimentos de
    // apartamentos (3º ao 22º) e a coroa do rooftop. Pares [pavimento, y].
    const PARADAS = [[0, 272], [1, 240], [2, 229], [3, 218], [22, 66], [24, 50]];
    const alturaDaCabine = (valor) => {
      for (let k = 1; k < PARADAS.length; k++) {
        const [f0, y0] = PARADAS[k - 1], [f1, y1] = PARADAS[k];
        if (valor <= f1) return y0 + (y1 - y0) * ((valor - f0) / (f1 - f0));
      }
      return PARADAS[PARADAS.length - 1][1];
    };

    const mostraAndar = (valor) => {
      if (valorAnterior !== null && Math.abs(valor - valorAnterior) > 0.001) {
        sentido = valor > valorAnterior ? 1 : -1;
      }
      valorAnterior = valor;
      const v = Math.round(valor);
      const { num, zona, pavimento, acesa } = rotuloDoAndar(v);
      if (elNum.textContent !== num) elNum.textContent = num;
      if (elZona.textContent !== zona) elZona.textContent = zona;
      if (elPavimento.textContent !== pavimento) elPavimento.textContent = pavimento;
      if (jornada.dataset.zona !== acesa) jornada.dataset.zona = acesa;
      elevador.style.bottom = `${((300 - alturaDaCabine(Math.max(0, valor))) / 300) * 100}%`;

      // chegou a uma parada vindo de outro andar: a luz pulsa uma vez
      const parada = PARADAS_NOMES[v] && Math.abs(valor - v) < 0.02 ? v : null;
      if (parada !== null && paradaAnterior !== null && parada !== paradaAnterior && !movimentoReduzido) {
        elevador.classList.remove('chegou');
        void elevador.offsetWidth;
        elevador.classList.add('chegou');
      }
      if (parada !== null) paradaAnterior = parada;
    };

    // Movimento reduzido ou sem GSAP: uma imagem fixa e scroll normal
    if (movimentoReduzido || !temGsap) {
      jornada.classList.add('jornada--estatica');
      // a imagem fixa só é baixada neste modo
      const fixa = jornada.querySelector('.jornada__estatica');
      if (fixa && fixa.dataset.src) fixa.src = fixa.dataset.src;
      mostraTextos(6);
      mostraAndar(24);
      return;
    }

    // modo animado: a imagem estática (só para "reduzir movimento") não precisa baixar
    const estatica = jornada.querySelector('.jornada__estatica');
    if (estatica) estatica.remove();

    const ctx = tela.getContext('2d', { alpha: false });
    const celular = window.matchMedia('(max-width: 699px) and (orientation: portrait)');
    let imagens = [];
    let largura = 0, altura = 0;
    const estado = { p: 0 };
    let ativo = -1;

    // Carrega o conjunto certo (celular ou computador): a primeira já, as outras em seguida.
    // decode() deixa cada imagem decodificada antes do primeiro desenho (sem piscar).
    const carrega = () => {
      const sufixo = celular.matches ? '_celular' : '';
      const conjunto = CENAS.map(() => null);
      imagens = conjunto;
      const busca = (k) => {
        const img = new Image();
        img.decoding = 'async';
        if (k === 0) img.fetchPriority = 'high';
        img.src = `img/jornada/${CENAS[k].arq}${sufixo}.webp`;
        return img.decode()
          .catch(() => {})
          .then(() => {
            if (imagens !== conjunto) return;
            conjunto[k] = img;
            desenha();
          });
      };
      busca(0).then(() => CENAS.slice(1).forEach((c, k) => busca(k + 1)));
    };

    const pronta = (k) => !!imagens[k];
    // se a imagem pedida ainda não chegou, usa a mais próxima que já chegou (sem piscar)
    const maisProxima = (k) => {
      for (let d = 0; d < total; d++) {
        if (pronta(k - d)) return k - d;
        if (pronta(k + d)) return k + d;
      }
      return -1;
    };

    // Nítido em telas densas, mas com teto de pixels: acima de ~2,6 milhões
    // o canvas fica caro de pintar e as fotos de origem nem têm tanto detalhe.
    const TETO_PIXELS = 2.6e6;
    const dimensiona = () => {
      const r = tela.getBoundingClientRect();
      const area = Math.max(1, r.width * r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(TETO_PIXELS / area));
      const l = Math.max(1, Math.round(r.width * Math.max(1, dpr)));
      const a = Math.max(1, Math.round(r.height * Math.max(1, dpr)));
      if (l !== largura || a !== altura) {
        largura = tela.width = l;
        altura = tela.height = a;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
      }
      desenha();
    };

    // corte tipo "cover", sem distorcer, com o centro de interesse da cena
    const cobre = (k, escala, alfa) => {
      const img = imagens[k];
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const s = Math.max(largura / iw, altura / ih) * escala;
      const w = iw * s, h = ih * s;
      const fx = celular.matches ? 0.5 : CENAS[k].fx;
      const x = Math.min(0, Math.max(largura - w, largura / 2 - fx * w));
      const y = (altura - h) / 2;
      ctx.globalAlpha = alfa;
      ctx.drawImage(img, x, y, w, h);
    };

    const suave = (t) => t * t * (3 - 2 * t);
    const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

    function desenha() {
      if (!largura) return;
      const pos = limita(estado.p * (total - 1 + SEGURA_FIM), 0, total - 1);
      const i = Math.min(Math.floor(pos), total - 1);
      const t = pos - i;
      // cada cena fica parada um pouco antes de fundir com a próxima
      const mistura = i < total - 1 ? suave(limita((t - 0.3) / 0.7)) : 0;
      // zoom lento e contínuo enquanto a cena está na tela
      const zoom = (k) => 1 + 0.06 * limita((pos - k + 1) / 2);

      const base = maisProxima(i);
      if (base >= 0) {
        cobre(base, zoom(i), 1);
        if (mistura > 0 && pronta(i + 1)) cobre(i + 1, zoom(i + 1), mistura);
        ctx.globalAlpha = 1;
        if (!jornada.classList.contains('jornada--viva')) jornada.classList.add('jornada--viva');
      }

      // andar do elevador: conta de 2 até 24 durante a subida
      const andarAtual = CENAS[i].andar + ((CENAS[Math.min(i + 1, total - 1)].andar - CENAS[i].andar) * mistura);
      mostraAndar(andarAtual);

      const novo = mistura > 0.5 ? i + 1 : i;
      if (novo !== ativo) {
        const primeira = ativo === -1;
        ativo = novo;
        if (primeira) { mostraTextos(novo); return; }
        painel.classList.add('trocando');
        clearTimeout(desenha.tempo);
        desenha.tempo = setTimeout(() => {
          mostraTextos(ativo);
          painel.classList.remove('trocando');
        }, 180);
      }
    }

    // Só baixa as imagens da subida depois que a página abriu (load) e quando a
    // seção está a meia tela de distância: a abertura carrega sem disputa, e ainda
    // sobra mais de uma tela de rolagem para as imagens chegarem antes da seção.
    let carregou = false;
    const observaProximidade = () => {
      new IntersectionObserver((entradas, obs) => {
        if (!entradas[0].isIntersecting || carregou) return;
        carregou = true;
        carrega();
        obs.disconnect();
      }, { rootMargin: '50% 0px' }).observe(jornada);
    };
    if (document.readyState === 'complete') observaProximidade();
    else window.addEventListener('load', observaProximidade, { once: true });
    celular.addEventListener('change', () => { if (carregou) carrega(); });
    new ResizeObserver(dimensiona).observe(tela);

    // O cartão arredondado se abre em tela cheia enquanto a subida chega ao topo
    const margemPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--margem')) || 20;
    gsap.fromTo(palco,
      { clipPath: () => `inset(0px ${margemPx()}px 0px ${margemPx()}px round 28px)` },
      {
        clipPath: 'inset(0px 0px 0px 0px round 0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: jornada,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

    // A subida: a seção trava (pin) e o scroll só avança as imagens
    gsap.to(estado, {
      p: 1,
      ease: 'none',
      onUpdate: desenha,
      scrollTrigger: {
        trigger: jornada,
        start: 'top top',
        end: () => `+=${Math.round(PX_POR_IMAGEM * (total - 1 + SEGURA_FIM))}`,
        pin: true,
        scrub: SCRUB,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  // Recalcula as posições quando fontes e imagens terminam de carregar
  if (temGsap) {
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- 4. Galeria em tela cheia ---------- */

  const itens = [...document.querySelectorAll('[data-galeria] .mosaico__item')];
  const tela = document.querySelector('[data-tela-cheia]');
  const telaImg = tela.querySelector('[data-tela-cheia-img]');
  const telaLegenda = tela.querySelector('[data-tela-cheia-legenda]');
  const telaContagem = tela.querySelector('[data-tela-cheia-contagem]');
  let atual = 0;
  let origem = null;

  // etiqueta em pílula com o nome do ambiente
  itens.forEach((item) => {
    const rotulo = document.createElement('span');
    rotulo.className = 'mosaico__rotulo';
    rotulo.setAttribute('aria-hidden', 'true');
    rotulo.textContent = item.dataset.legenda;
    item.appendChild(rotulo);
  });

  const mostra = (indice) => {
    atual = (indice + itens.length) % itens.length;
    const item = itens[atual];
    const img = item.querySelector('img');

    // na grade fica a miniatura; a tela cheia usa a versão grande
    const troca = () => {
      telaImg.src = img.dataset.full || img.currentSrc || img.src;
      telaImg.alt = img.alt;
      telaLegenda.textContent = item.dataset.legenda;
      telaContagem.textContent = `${atual + 1} de ${itens.length}`;
    };

    if (!tela.open || movimentoReduzido) { troca(); return; }
    telaImg.classList.add('trocando');
    setTimeout(() => {
      troca();
      const revela = () => telaImg.classList.remove('trocando');
      if (telaImg.complete) revela(); else telaImg.addEventListener('load', revela, { once: true });
    }, 180);

    [atual - 1, atual + 1].forEach((i) => {
      const viz = itens[(i + itens.length) % itens.length].querySelector('img');
      new Image().src = viz.dataset.full || viz.currentSrc || viz.src;
    });
  };

  const abreTela = (indice) => {
    origem = itens[indice];
    mostra(indice);
    tela.showModal();
    travaScroll(true);
  };

  const fechaTela = () => {
    if (tela.open) tela.close();
  };

  tela.addEventListener('close', () => {
    travaScroll(false);
    if (origem) origem.focus({ preventScroll: true });
  });

  itens.forEach((item, i) => item.addEventListener('click', () => abreTela(i)));
  tela.querySelector('[data-fechar]').addEventListener('click', fechaTela);
  tela.querySelector('[data-anterior]').addEventListener('click', () => mostra(atual - 1));
  tela.querySelector('[data-proxima]').addEventListener('click', () => mostra(atual + 1));

  tela.addEventListener('click', (e) => {
    if (e.target === tela || e.target.classList.contains('tela-cheia__figura')) fechaTela();
  });

  tela.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); mostra(atual - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); mostra(atual + 1); }
  });

  let toqueX = null, toqueY = null;
  tela.addEventListener('touchstart', (e) => {
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;
  }, { passive: true });
  tela.addEventListener('touchend', (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    const dy = e.changedTouches[0].clientY - toqueY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) mostra(atual + (dx < 0 ? 1 : -1));
    toqueX = toqueY = null;
  }, { passive: true });

  /* ---------- 5. Contato ---------- */

  const form = document.querySelector('[data-formulario]');
  const sucesso = document.querySelector('[data-sucesso]');
  const sucessoNome = document.querySelector('[data-sucesso-nome]');
  const fotoContato = document.querySelector('[data-foto-contato] img');
  const fotoLegenda = document.querySelector('[data-foto-legenda]');
  const telefone = form.telefone;

  const fotosApartamento = {
    'Tipo 1': {
      src: 'img/albor_tipo1_02.webp',
      alt: 'Cozinha e mesa de jantar do apartamento tipo 1, abertas para a varanda gourmet ao pôr do sol',
      legenda: 'Tipo 1, cozinha e varanda gourmet',
      posicao: '68% 50%',
    },
    'Tipo 1 ampliado': {
      src: 'img/albor_tipo1_ampliado_01.webp',
      alt: 'Sala de jantar do apartamento tipo 1 ampliado, com mesa redonda de madeira, cadeiras claras e quadro em tons de rosa',
      legenda: 'Tipo 1 ampliado, sala de jantar',
      posicao: '30% 50%',
    },
    'Tipo 4': {
      src: 'img/albor_tipo4_05.webp',
      alt: 'Sala do apartamento tipo 4 com poltronas, ripado de madeira e cozinha integrada',
      legenda: 'Tipo 4, sala e cozinha integradas',
      posicao: '22% 50%',
    },
    'Ainda não sei': {
      src: fotoContato.getAttribute('src'),
      alt: fotoContato.alt,
      legenda: fotoLegenda.textContent,
      posicao: fotoContato.style.objectPosition,
    },
  };

  new IntersectionObserver((entradas, obs) => {
    if (!entradas[0].isIntersecting) return;
    Object.values(fotosApartamento).forEach((f) => { new Image().src = f.src; });
    obs.disconnect();
  }, { rootMargin: '400px 0px' }).observe(form);

  const trocaFoto = (tipo) => {
    const foto = fotosApartamento[tipo];
    if (!foto || fotoContato.getAttribute('src') === foto.src) return;
    const aplica = () => {
      fotoContato.src = foto.src;
      fotoContato.alt = foto.alt;
      fotoContato.style.objectPosition = foto.posicao;
      fotoLegenda.textContent = foto.legenda;
      const revela = () => fotoContato.classList.remove('trocando');
      if (fotoContato.complete) revela(); else fotoContato.addEventListener('load', revela, { once: true });
    };
    if (movimentoReduzido) { aplica(); return; }
    fotoContato.classList.add('trocando');
    setTimeout(aplica, 300);
  };

  form.querySelectorAll('input[name="apartamento"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      trocaFoto(radio.value);
      validaCampo('apartamento');
    });
  });

  // Máscara do telefone: (12) 99999-9999
  telefone.addEventListener('input', () => {
    const d = telefone.value.replace(/\D/g, '').slice(0, 11);
    let v = d;
    if (d.length > 0) v = '(' + d.slice(0, 2);
    if (d.length >= 3) v += ') ' + (d.length === 11 ? d.slice(2, 7) + (d.length > 7 ? '-' + d.slice(7) : '') : d.slice(2, 6) + (d.length > 6 ? '-' + d.slice(6) : ''));
    telefone.value = v;
  });

  const regras = {
    nome: () => {
      const v = form.nome.value.trim();
      if (!v) return 'Escreva seu nome.';
      if (v.length < 2) return 'Escreva seu nome completo.';
      return '';
    },
    telefone: () => {
      const d = telefone.value.replace(/\D/g, '');
      if (!d) return 'Escreva seu telefone com DDD.';
      if (d.length < 10) return 'Confira o número: são o DDD e mais 8 ou 9 dígitos.';
      return '';
    },
    email: () => {
      const v = form.email.value.trim();
      if (!v) return 'Escreva seu e-mail.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Confira o e-mail, por exemplo: nome@email.com.';
      return '';
    },
    apartamento: () => (form.apartamento.value ? '' : 'Escolha uma opção, mesmo que seja "Ainda não sei".'),
    aceite: () => (form.aceite.checked ? '' : 'Marque o aceite para a equipe poder falar com você.'),
  };

  function validaCampo(nome) {
    const mensagem = regras[nome]();
    const erro = document.getElementById(`${nome}-erro`);
    erro.textContent = mensagem;
    if (nome === 'apartamento') {
      form.querySelector('.escolha').classList.toggle('invalido', !!mensagem);
    } else {
      form[nome].setAttribute('aria-invalid', mensagem ? 'true' : 'false');
    }
    return !mensagem;
  }

  ['nome', 'telefone', 'email'].forEach((nome) => {
    form[nome].addEventListener('blur', () => { if (form[nome].value) validaCampo(nome); });
    form[nome].addEventListener('input', () => {
      if (form[nome].getAttribute('aria-invalid') === 'true') validaCampo(nome);
    });
  });
  form.aceite.addEventListener('change', () => validaCampo('aceite'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const campos = Object.keys(regras);
    const resultados = campos.map(validaCampo);
    const primeiroErro = campos[resultados.indexOf(false)];
    if (primeiroErro) {
      const alvo = primeiroErro === 'apartamento'
        ? form.querySelector('input[name="apartamento"]')
        : form[primeiroErro];
      alvo.focus();
      return;
    }

    // No treino, o contato não é enviado de verdade.
    const primeiroNome = form.nome.value.trim().split(/\s+/)[0];
    sucessoNome.textContent = primeiroNome ? `, ${primeiroNome}` : '';
    form.hidden = true;
    sucesso.hidden = false;
    sucesso.focus();
    if (temGsap) ScrollTrigger.refresh();
  });

  document.querySelector('[data-novo-contato]').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
    form.querySelectorAll('.campo__erro').forEach((c) => { c.textContent = ''; });
    trocaFoto('Ainda não sei');
    sucesso.hidden = true;
    form.hidden = false;
    form.nome.focus();
    if (temGsap) ScrollTrigger.refresh();
  });

  // WhatsApp: sem ação por enquanto. Quando houver número, o link será
  // https://wa.me/<WHATSAPP_NUMERO>?text=<mensagem do data-mensagem>
  void WHATSAPP_NUMERO;
})();
