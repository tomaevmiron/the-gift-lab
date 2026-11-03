/* The Gift Lab Lloret: sin librerías. Muelles propios, olas en SVG y mucho salto. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ─── Idiomas: el español está en el HTML; se guarda aquí antes de tocar nada
         para poder volver a él. Catalán e inglés vienen de idiomas.js ─── */
  const TEXTOS = window.TEXTOS;
  let idioma = window.IDIOMA || 'es';
  const textosBase = $$('[data-t]').map(el => ({ el, clave: el.dataset.t, base: el.innerHTML }));
  const atributosBase = [['t-alt', 'alt'], ['t-aria', 'aria-label'], ['t-title', 'title']].flatMap(([d, attr]) =>
    $$(`[data-${d}]`).map(el => ({ el, attr, clave: el.getAttribute(`data-${d}`), base: el.getAttribute(attr) })));
  const hojasBase = $$('.hoja').map(h => ({
    marca: h.dataset.marca, nombre: h.dataset.nombre, txt: h.dataset.txt,
    alt: $('img', h).alt, aria: $('.hoja__boton', h).getAttribute('aria-label'),
  }));
  const descBase = $('meta[name="description"]').content;

  /* ─── Horario de invierno. Si cambia, se toca aquí y en el cartel del HTML.
         Minutos desde medianoche, 0 = domingo. ─── */
  const HORARIO = {
    2: [[660, 1080]], 3: [[660, 1080]], 4: [[660, 1080]], 5: [[660, 1080]],
    6: [[630, 810], [1020, 1200]],
  };

  /* ─── Anillo rosa de los títulos, como el recorte del logo ─── */
  const anillo = (() => {
    const out = [];
    [[.13, 28], [.09, 20], [.05, 12]].forEach(([r, n]) => {
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        out.push(`${(Math.cos(a) * r).toFixed(3)}em ${(Math.sin(a) * r).toFixed(3)}em 0 var(--anillo-color)`);
      }
    });
    return out.join(',');
  })();
  $$('.t-pegatina').forEach(e => { e.style.textShadow = anillo; });

  /* ─── Logo vivo: mismas formas, pero las letras se pueden mover ─── */
  const LETRAS = ['t1', 'h', 'e', 'g', 'i', 'f', 't2', 'l', 'a', 'b'];
  $$('[data-logo="vivo"], .cabecera__logo').forEach(caja => {
    const svg = $('svg', caja);
    svg.innerHTML =
      `<use class="b" href="#lg-blob" fill="#FEBCD8"/><g fill="#F62C04">` +
      LETRAS.map((k, i) => `<use class="l" style="--i:${i}" href="#lg-${k}"/>`).join('') + `</g>`;
  });
  const saltarLogo = svg => {
    if (calma) return;
    $$('.l', svg).forEach(l => {
      l.classList.remove('hop', 'pop');
      void l.getBoundingClientRect();
      l.classList.add('hop');
    });
  };
  $$('[data-logo]').forEach(caja => {
    const svg = $('svg', caja);
    if (!$('.l', svg)) return;
    caja.addEventListener('pointerenter', () => saltarLogo(svg));
  });
  const logoPortada = $('.portada__logo svg');
  if (logoPortada && !calma) {
    $('.b', logoPortada).classList.add('pop');
    $$('.l', logoPortada).forEach(l => l.classList.add('pop'));
    setInterval(() => { if (scrollY < innerHeight * .6 && !document.hidden) saltarLogo(logoPortada); }, 7200);
  }

  /* ─── Partir títulos en letras o palabras para que salten ─── */
  const partirLetras = (el, txt) => {
    el.setAttribute('aria-label', txt);
    let i = 0;
    el.innerHTML = txt.split(' ').map(p =>
      `<span class="palabra-entera" aria-hidden="true">` +
      [...p].map(c => `<span class="letra" style="--i:${i++}">${c}</span>`).join('') +
      `</span>`).join(' ');
  };
  const partirPalabras = (el, html) => {
    const molde = document.createElement('div');
    molde.innerHTML = html;
    let i = 0;
    el.textContent = '';
    [...molde.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (!t.trim()) { el.append(' '); return; }
          const s = document.createElement('span');
          s.className = 'palabra'; s.style.setProperty('--i', i++); s.textContent = t;
          el.append(s);
        });
      } else {
        n.classList.add('palabra'); n.style.setProperty('--i', i++);
        if (n.classList.contains('t-pegatina')) n.style.textShadow = anillo;
        el.append(n);
      }
    });
  };
  // el lema no se traduce; el resto de títulos los parte traducir()
  $$('[data-letras]:not([data-t])').forEach(el => partirLetras(el, el.textContent.trim()));
  const lema = $('[data-letras="retardo"]');
  lema.style.setProperty('--espera', '.8s');
  requestAnimationFrame(() => lema.classList.add('ya'));

  /* ─── Tablero de letras: cada letra un poco torcida, como en la tienda ─── */
  const partirTablero = () => {
    $$('[data-tablero] p').forEach((p, n, todas) => {
      const base = todas.slice(0, n).reduce((s, q) => s + q.textContent.length, 0);
      const txt = p.textContent;
      p.innerHTML = [...txt].map((c, i) => c.trim() === ''
        ? c
        : `<span class="tecla" style="--i:${base + i};--g:${((i * 37 + n * 13) % 7 - 3) * .5}deg">${c}</span>`).join('');
    });
  };

  /* ─── Aparecer al entrar en pantalla ─── */
  const ven = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('ya');
    ven.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('[data-salto], [data-letras]:not([data-letras="retardo"]), [data-palabras], [data-tablero]').forEach(el => ven.observe(el));
  // el marco de portada y lo que ya está a la vista no esperan
  setTimeout(() => $$('.portada [data-salto]').forEach(el => el.classList.add('ya')), 60);

  /* ─── Gelatina al pasar por encima ─── */
  const gelatina = el => {
    if (calma || !el.animate) return;
    el.animate(
      [{ transform: 'scale(1,1)' }, { transform: 'scale(1.05,.95)' }, { transform: 'scale(.97,1.03)' }, { transform: 'scale(1.015,.985)' }, { transform: 'scale(1,1)' }],
      { duration: 620, easing: 'ease-out' });
  };
  $$('[data-gelatina]').forEach(el => el.addEventListener('pointerenter', () => gelatina($('img', el) || el)));
  $$('[data-pegatina]').forEach(el => el.addEventListener('pointerenter', () => gelatina($('img', el))));
  $$('.opcion, .verbo').forEach(el => el.addEventListener('pointerenter', () => gelatina(el)));

  /* ─── Olas: la línea del cartel de la tienda, viva.
         Se mueve despacio y se alegra cuando haces scroll. ─── */
  const forma = u => Math.sin(u) + .22 * Math.cos(2 * u);
  const dibujos = [];
  const miraOlas = new IntersectionObserver(es => es.forEach(e => {
    const d = dibujos.find(x => x.svg === e.target);
    if (d) d.visible = e.isIntersecting;
  }), { rootMargin: '120px' });

  class Marco {
    constructor(svg) {
      this.svg = svg;
      this.path = svg.appendChild(document.createElementNS(NS, 'path'));
      this.visible = true;
      this.medir();
    }
    medir() {
      const cs = getComputedStyle(this.svg);
      const w = parseFloat(cs.width), h = parseFloat(cs.height);
      if (!w) return;
      const escala = limita(innerWidth / 1280, .62, 1.15);
      this.amp = (parseFloat(cs.getPropertyValue('--amp')) || 12) * escala;
      const onda = (parseFloat(cs.getPropertyValue('--onda')) || 110) * escala;
      this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // perímetro de un rectángulo redondeado, metido hacia dentro para que quepa la onda
      const m = this.amp * 1.3 + 3, R = Math.min(w, h) * .09;
      const x0 = m, y0 = m, x1 = w - m, y1 = h - m;
      const lx = x1 - x0 - 2 * R, ly = y1 - y0 - 2 * R, arco = Math.PI * R / 2;
      const P = 2 * lx + 2 * ly + 4 * arco;
      const N = Math.max(8, Math.round(P / onda));
      const puntos = N * 12;
      this.pts = [];
      for (let k = 0; k < puntos; k++) {
        let s = k / puntos * P, px, py, nx, ny;
        if (s < lx) { px = x0 + R + s; py = y0; nx = 0; ny = -1; }
        else if ((s -= lx) < arco) { const a = -Math.PI / 2 + s / R; px = x1 - R + Math.cos(a) * R; py = y0 + R + Math.sin(a) * R; nx = Math.cos(a); ny = Math.sin(a); }
        else if ((s -= arco) < ly) { px = x1; py = y0 + R + s; nx = 1; ny = 0; }
        else if ((s -= ly) < arco) { const a = s / R; px = x1 - R + Math.cos(a) * R; py = y1 - R + Math.sin(a) * R; nx = Math.cos(a); ny = Math.sin(a); }
        else if ((s -= arco) < lx) { px = x1 - R - s; py = y1; nx = 0; ny = 1; }
        else if ((s -= lx) < arco) { const a = Math.PI / 2 + s / R; px = x0 + R + Math.cos(a) * R; py = y1 - R + Math.sin(a) * R; nx = Math.cos(a); ny = Math.sin(a); }
        else if ((s -= arco) < ly) { px = x0; py = y1 - R - s; nx = -1; ny = 0; }
        else { s -= ly; const a = Math.PI + s / R; px = x0 + R + Math.cos(a) * R; py = y0 + R + Math.sin(a) * R; nx = Math.cos(a); ny = Math.sin(a); }
        const f = k / puntos, dos = Math.PI * 2;
        this.pts.push({
          px, py, nx, ny,
          u: dos * N * f + 1.1 * Math.sin(dos * 3 * f + 1) + .6 * Math.sin(dos * 5 * f),
          a: 1 + .16 * Math.sin(dos * 4 * f + 2),
        });
      }
    }
    pintar(t, alegria) {
      if (!this.pts) return;
      const A = this.amp * (1 + .08 * Math.sin(t * .9) + alegria * .55);
      const fase = t * .55 + faseExtra;
      let d = '';
      for (let i = 0; i < this.pts.length; i++) {
        const p = this.pts[i], o = A * p.a * forma(p.u + fase);
        d += (i ? 'L' : 'M') + (p.px + p.nx * o).toFixed(1) + ' ' + (p.py + p.ny * o).toFixed(1);
      }
      this.path.setAttribute('d', d + 'Z');
    }
  }

  class Ola {
    constructor(svg, i) {
      this.svg = svg;
      this.path = svg.appendChild(document.createElementNS(NS, 'path'));
      this.fase = i * 1.7;
      this.visible = true;
      this.medir();
    }
    medir() {
      const cs = getComputedStyle(this.svg);
      this.w = parseFloat(cs.width); this.h = parseFloat(cs.height);
      if (!this.w) return;
      this.svg.setAttribute('viewBox', `0 0 ${this.w} ${this.h}`);
      this.onda = limita(this.w / 11, 74, 150);
      this.paso = this.onda / 12;
    }
    pintar(t, alegria) {
      if (!this.w) return;
      const A = this.h * .26 * (1 + .07 * Math.sin(t * .8 + this.fase) + alegria * .5);
      const fase = t * .5 + this.fase + faseExtra;
      const dos = Math.PI * 2;
      let d = `M0 ${this.h + 2}`;
      for (let x = 0; x <= this.w + this.paso; x += this.paso) {
        const f = x / this.onda * dos + .7 * Math.sin(x / this.w * dos * 2 + this.fase);
        d += 'L' + x.toFixed(1) + ' ' + (this.h * .56 - A * forma(f + fase)).toFixed(1);
      }
      this.path.setAttribute('d', d + `L${(this.w + this.paso).toFixed(1)} ${this.h + 2}Z`);
    }
  }

  $$('[data-marco]').forEach(s => dibujos.push(new Marco(s)));
  $$('[data-ola]').forEach((s, i) => dibujos.push(new Ola(s, i)));
  dibujos.forEach(d => miraOlas.observe(d.svg));
  const ro = new ResizeObserver(es => es.forEach(e => {
    const d = dibujos.find(x => x.svg === e.target);
    if (d) { d.medir(); d.pintar(performance.now() / 1000, 0); }
  }));
  dibujos.forEach(d => ro.observe(d.svg));

  /* ─── El abanico de Select: rueda de 12 hojas que se abre al llegar a ella
         y gira deslizando hacia los lados. El scroll vertical no la toca. ─── */
  const rueda = (() => {
    const sec = $('[data-rueda]');
    if (!sec || calma) return null;
    sec.classList.add('rueda--viva');
    const escena = $('.rueda__escena', sec);
    const hojas = $$('.hoja', sec);
    $$('img', sec).forEach(i => { i.draggable = false; });
    const rotulo = $('.rueda__rotulo', sec);
    const pista = $('.rueda__pista', sec);
    rotulo.hidden = false; pista.hidden = false;
    const campos = {};
    $$('[data-rotulo]', rotulo).forEach(e => campos[e.dataset.rotulo] = e);
    const n = hojas.length, PASO = 360 / n;
    let R = 500, pxPorHoja = 260;
    const medir = () => {
      R = hojas[0].offsetWidth * 1.92;
      // el arco que recorre una hoja: así la rueda va pegada al dedo
      pxPorHoja = R * PASO * Math.PI / 180;
      sec.style.setProperty('--R', R + 'px');
    };
    medir();
    addEventListener('resize', medir);
    addEventListener('load', medir);

    let abre = 0, vAbre = 0, idx = 0, vIdx = 0, objI = 0, activa = -1;
    let toque = null, ignorarClick = false, saludo = false;
    const tocada = () => { pista.classList.add('fuera'); saludo = true; };

    const rellenar = i => {
      const h = hojas[i];
      campos.marca.textContent = h.dataset.marca;
      campos.nombre.textContent = h.dataset.nombre;
      campos.txt.textContent = h.dataset.txt;
      campos.n.textContent = String(i + 1).padStart(2, '0');
    };
    const escribir = i => {
      rellenar(i);
      const h = hojas[i];
      if (activa !== -1 && rotulo.animate) {
        campos.nombre.animate(
          [{ transform: 'translateY(.35em) scale(.96,1.06)', opacity: .2 }, { transform: 'translateY(-.08em) scale(1.03,.97)', opacity: 1, offset: .55 }, { transform: 'none', opacity: 1 }],
          { duration: 460, easing: 'ease-out' });
        gelatina($('img', h));
      }
      activa = i;
    };
    escribir(0);

    // tocar una hoja la trae al centro por el camino más corto
    hojas.forEach((h, i) => {
      $('.hoja__boton', h).addEventListener('click', () => {
        if (ignorarClick) return;
        const base = Math.round(objI);
        let d = (i - base) % n;
        if (d > n / 2) d -= n; else if (d < -n / 2) d += n;
        objI = base + d;
        tocada();
      });
    });

    /* Arrastre lateral con dedo o ratón. Con touch-action: pan-y el navegador
       se queda el gesto vertical, así que la página baja con normalidad. */
    const suelta = e => {
      if (!toque || e.pointerId !== toque.id) return;
      if (toque.arrastra) {
        const vel = e.timeStamp - toque.t > 90 ? 0 : toque.vel;
        objI = Math.round(idx + limita(vel * .22, -3, 3));
        vIdx = limita(vel, -14, 14);
        escena.classList.remove('arrastrando');
        ignorarClick = true;
        setTimeout(() => { ignorarClick = false; });
      }
      toque = null;
    };
    escena.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      toque = { id: e.pointerId, x: e.clientX, base: idx, ult: e.clientX, t: e.timeStamp, vel: 0, arrastra: false };
    });
    escena.addEventListener('pointermove', e => {
      if (!toque || e.pointerId !== toque.id) return;
      if (!e.buttons) { suelta(e); return; }
      if (!toque.arrastra) {
        if (Math.abs(e.clientX - toque.x) < 6) return;
        toque.arrastra = true;
        toque.x = toque.ult = e.clientX;
        toque.base = idx;
        escena.setPointerCapture(e.pointerId);
        escena.classList.add('arrastrando');
        tocada();
      }
      const dt = Math.max(1, e.timeStamp - toque.t) / 1000;
      toque.vel = toque.vel * .7 + (-(e.clientX - toque.ult) / pxPorHoja / dt) * .3;
      toque.ult = e.clientX;
      toque.t = e.timeStamp;
      // dedo a la derecha, rueda a la derecha
      idx = toque.base - (e.clientX - toque.x) / pxPorHoja;
    });
    escena.addEventListener('pointerup', suelta);
    escena.addEventListener('pointercancel', suelta);

    // dos dedos hacia los lados en el trackpad; si el gesto es vertical, baja la página
    let finTrackpad;
    escena.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      objI += e.deltaX * (e.deltaMode === 1 ? 16 : 1) / pxPorHoja;
      tocada();
      clearTimeout(finTrackpad);
      finTrackpad = setTimeout(() => { objI = Math.round(objI); }, 140);
    }, { passive: false });

    // con teclado: flechas izquierda y derecha
    $('.rueda__lista', sec).addEventListener('keydown', e => {
      const salto = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!salto) return;
      e.preventDefault();
      objI = Math.round(objI) + salto;
      tocada();
      $('.hoja__boton', hojas[((objI % n) + n) % n]).focus({ preventScroll: true });
    });

    return {
      refrescar() { rellenar(activa); },
      paso(dt) {
        const r = sec.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        // se abre según entra en pantalla; muelles un pelín flojos: se pasan y vuelven, contentos
        const objA = limita((innerHeight - r.top) / (innerHeight * .8));
        vAbre += (-(abre - objA) * 70 - vAbre * 9) * dt;
        abre += vAbre * dt;
        // al abrirse del todo amaga un giro, para que se vea que se mueve
        if (!saludo && abre > .95) { saludo = true; vIdx += 3.6; }
        if (!(toque && toque.arrastra)) {
          vIdx += (-(idx - objI) * 95 - vIdx * 15) * dt;
          idx += vIdx * dt;
        }

        hojas.forEach((h, i) => {
          let d = (i - idx) % n;
          if (d > n / 2) d -= n; else if (d < -n / 2) d += n;
          const ang = d * PASO * abre;
          const cerca = Math.exp(-d * d * 1.5);
          if (Math.abs(ang) > 112) { h.style.visibility = 'hidden'; return; }
          h.style.visibility = 'visible';
          h.style.transform = `rotate(${ang.toFixed(2)}deg) translateY(${(-cerca * 16 * abre).toFixed(1)}px) scale(${(.95 + cerca * .07).toFixed(3)})`;
          h.style.zIndex = 20 - Math.round(Math.abs(d));
        });
        const i = ((Math.round(idx) % n) + n) % n;
        if (i !== activa) escribir(i);
      },
    };
  })();

  /* ─── Pegatinas de portada: siguen un poco al ratón, con muelle ─── */
  const pegatinas = (() => {
    if (!fino || calma) return null;
    const pp = $$('[data-pegatina]').map(el => ({ el, f: parseFloat(el.style.getPropertyValue('--f')) || .5, x: 0, y: 0, vx: 0, vy: 0 }));
    let mx = 0, my = 0;
    $('.portada').addEventListener('pointermove', e => {
      mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    });
    $('.portada').addEventListener('pointerleave', () => { mx = my = 0; });
    return {
      paso(dt) {
        if (scrollY > innerHeight) return;
        pp.forEach(p => {
          const tx = mx * 34 * p.f, ty = my * 26 * p.f;
          p.vx += (-(p.x - tx) * 60 - p.vx * 8) * dt; p.x += p.vx * dt;
          p.vy += (-(p.y - ty) * 60 - p.vy * 8) * dt; p.y += p.vy * dt;
          p.el.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
        });
      },
    };
  })();

  /* ─── Cabecera: el logo pequeño aparece al dejar la portada ─── */
  const cab = $('#cabecera');

  /* ─── Bucle único ─── */
  let ultimo = performance.now(), yAnt = scrollY, yCab = scrollY, alegria = 0, faseExtra = 0;
  const bucle = ahora => {
    const dt = Math.min(.034, (ahora - ultimo) / 1000) || .016;
    ultimo = ahora;
    const v = Math.abs(scrollY - yAnt) / dt;
    yAnt = scrollY;
    alegria += (limita(v / 2600) - alegria) * Math.min(1, dt * (v / 2600 > alegria ? 9 : 2.2));
    faseExtra += alegria * dt * 3.4;
    const t = ahora / 1000;
    for (const d of dibujos) if (d.visible) d.pintar(t, alegria);
    if (rueda) rueda.paso(dt);
    if (pegatinas) pegatinas.paso(dt);
    cab.classList.toggle('cabecera--pegada', scrollY > innerHeight * .62);
    if (Math.abs(scrollY - yCab) > 12) {
      cab.classList.toggle('cabecera--oculta', scrollY > yCab && scrollY > innerHeight * .9);
      yCab = scrollY;
    }
    requestAnimationFrame(bucle);
  };
  dibujos.forEach(d => d.pintar(0, 0));
  if (calma) addEventListener('scroll', () => cab.classList.toggle('cabecera--pegada', scrollY > innerHeight * .62), { passive: true });
  else requestAnimationFrame(bucle);

  /* ─── ¿Abierto ahora? Hora de Lloret, esté donde esté quien mira ─── */
  const estado = () => {
    const partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const val = k => partes.find(x => x.type === k).value;
    const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(val('weekday'));
    const min = (+val('hour') % 24) * 60 + +val('minute');
    const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const T = TEXTOS[idioma];
    const hoy = HORARIO[dia] || [];
    const tramo = hoy.find(([a, b]) => min >= a && min < b);
    let txt, abierto = false;
    if (tramo) { abierto = true; txt = T.abierto(hhmm(tramo[1])); }
    else {
      const luego = hoy.find(([a]) => min < a);
      if (luego) txt = T.abrimos(hhmm(luego[0]));
      else {
        for (let s = 1; s <= 7; s++) {
          const d = (dia + s) % 7;
          if (HORARIO[d]) {
            const h = hhmm(HORARIO[d][0][0]);
            txt = s === 1 ? T.manana(h) : T.otroDia(T.dias[d], h);
            break;
          }
        }
      }
    }
    $$('[data-estado]').forEach(e => {
      e.classList.toggle('abierto', abierto);
      $('.estado__txt', e).textContent = txt;
    });
    $$('[data-dias]').forEach(e => e.classList.toggle('hoy', e.dataset.dias.split(',').includes(String(dia))));
  };
  estado();
  setInterval(estado, 60000);

  /* ─── Taller próximo: se retira solo cuando pasa la fecha ─── */
  const proximo = $('[data-taller-proximo]');
  if (proximo && new Date(proximo.dataset.hasta + 'T23:59:59+01:00') < new Date()) {
    proximo.hidden = true; proximo.style.display = 'none';
    $('[data-taller-vacio]').hidden = false;
  }
  $$('[data-anio]').forEach(e => e.textContent = new Date().getFullYear());

  /* ─── La fórmula del regalo ─── */
  const REGALOS = {
    abanico: { img: 'abanico', nombre: 'Un abanico ¡Qué calor!', alt: 'Abanico rosa ¡Qué calor!' },
    dolce: { img: 'dolcevita', nombre: 'Un abanico La dolce vita', alt: 'Abanico negro La dolce vita' },
    lava: { img: 'lava', nombre: 'Una lámpara de lava', alt: 'Lámparas de lava de colores' },
    vela: { img: 'velas', nombre: 'Una lava con vela', alt: 'Lámpara de lava con vela' },
    teula: { img: 'teula', nombre: 'La lámpara Teula', alt: 'Lámpara Teula encendida' },
    tazas: { img: 'tazas', nombre: 'Una taza NYC', alt: 'Tazas con la palabra coffee' },
    clutch: { img: 'clutch', nombre: 'Un clutch XL', alt: 'Clutches bordados de colores' },
    peces: { img: 'peces', nombre: 'Los saleros pez', alt: 'Saleros con forma de pez' },
    camara: { img: 'camaras', nombre: 'Una cámara mini', alt: 'Cámaras en miniatura' },
    maleta: { img: 'equipaje', nombre: 'Correas y etiquetas', alt: 'Correas de maleta y etiquetas' },
    kit: { img: 'kit', nombre: 'Un kit de verano', alt: 'Kit de verano' },
    pulsera: { img: 'taller-pulsera', nombre: 'Un taller de pulseras', alt: 'Taller de pulseras Ball Chain' },
    cubo: { img: 'taller-cubo', nombre: 'Un taller Cube Lamp', alt: 'Lámpara cubo iridiscente' },
    brunch: { img: 'taller-brunch', nombre: 'Automaquillaje con brunch', alt: 'Taller de automaquillaje' },
  };
  const FORMULAS = {
    amiga: {
      risa: ['abanico', 'Lo saca en la primera terraza y ya tenéis tema para toda la tarde.'],
      casa: ['lava', 'Se va a quedar hipnotizada. Y tú vas a querer otra para ti.'],
      lucir: ['clutch', 'Puro color. De esos bolsos que le van a comentar en cada sitio.'],
      crear: ['pulsera', 'Un plan juntas y una pulsera hecha por ella. Pregúntanos por la próxima fecha.'],
    },
    madre: {
      risa: ['peces', 'Sal y pimienta con cara de pez. La comida de los domingos no volverá a ser igual.'],
      casa: ['teula', 'Una teja que se enciende. Va a cambiar de sitio tres veces hasta encontrarle rincón.'],
      lucir: ['dolce', 'La dolce vita no es un destino, es una actitud. Y cabe en el bolso.'],
      crear: ['brunch', 'Una mañana de trucos de maquillaje y brunch. Plan redondo.'],
    },
    viaje: {
      risa: ['maleta', 'Para que su maleta tenga personalidad y nadie se la lleve por error.'],
      casa: ['tazas', 'Para el café de cuando vuelve a casa, que es el que mejor sabe.'],
      lucir: ['kit', 'Toalla, abanico, botella y riñonera. Maleta medio hecha.'],
      crear: ['camara', 'Ya no hay excusa para no inmortalizar cada planazo.'],
    },
    todo: {
      risa: ['peces', 'Lo tiene todo, seguro, menos unos saleros con cara de pez.'],
      casa: ['vela', 'Un objeto que no esperaba y del que no va a saber apartar la vista.'],
      lucir: ['clutch', 'Bolitas bordadas, una a una. Esto no lo tiene.'],
      crear: ['cubo', 'Lo único que no se compra: una lámpara hecha por sus manos. Pregúntanos por la próxima fecha.'],
    },
    yo: {
      risa: ['abanico', 'Sobrevivir al calor está bien. Hacerlo con estilo, mejor.'],
      casa: ['lava', 'Para mirarla un rato y no pensar en nada. Te lo mereces.'],
      lucir: ['clutch', 'Un caprichito de los buenos. Tú no pasas desapercibida.'],
      crear: ['pulsera', 'Te vas con algo hecho por ti, y con un café de por medio. Pregúntanos por la próxima fecha.'],
    },
  };
  const lab = $('[data-lab]');
  const resultado = $('[data-resultado]');
  const matraz = $('.matraz', lab);
  const espera = $('[data-lab-espera]');
  const elegido = { para: null, plan: null };
  const NIVELES = ['248px', '200px', '150px'];
  const nivel = n => {
    lab.dataset.nivel = n;
    $('.matraz__liquido', lab).style.setProperty('--nivel', NIVELES[n]);
  };
  nivel(0);
  const brinca = (el, fuerte = 1) => {
    if (calma || !el.animate) return;
    el.animate([
      { transform: 'none' },
      { transform: `translateY(0) scale(${1 + .1 * fuerte},${1 - .12 * fuerte})`, offset: .18 },
      { transform: `translateY(${-14 * fuerte}%) scale(${1 - .05 * fuerte},${1 + .07 * fuerte})`, offset: .5 },
      { transform: `translateY(0) scale(${1 + .05 * fuerte},${1 - .06 * fuerte})`, offset: .78 },
      { transform: 'none' },
    ], { duration: 760, easing: 'ease-out' });
  };
  // escribe lo que toca en el idioma actual; devuelve true si ya hay regalo
  const pintarLab = () => {
    const T = TEXTOS[idioma];
    const total = (elegido.para ? 1 : 0) + (elegido.plan ? 1 : 0);
    if (total < 2) {
      espera.hidden = false;
      espera.textContent = total ? T.faltaUno : T.faltanDos;
      resultado.hidden = true;
      lab.classList.remove('con-resultado');
      return false;
    }
    const [clave, txtBase] = FORMULAS[elegido.para][elegido.plan];
    const r = REGALOS[clave];
    const tr = T.regalos ? T.regalos[clave] : r;
    const img = $('[data-r="img"]', resultado);
    img.src = `img/${r.img}.jpg`; img.alt = tr.alt;
    $('[data-r="nombre"]', resultado).textContent = tr.nombre;
    $('[data-r="txt"]', resultado).textContent = T.formulas ? T.formulas[elegido.para][elegido.plan] : txtBase;
    espera.hidden = true;
    resultado.hidden = false;
    lab.classList.add('con-resultado');
    return true;
  };
  const mezclar = () => {
    const total = (elegido.para ? 1 : 0) + (elegido.plan ? 1 : 0);
    nivel(total);
    brinca(matraz, total === 2 ? 1 : .6);
    if (pintarLab() && !calma && resultado.animate) {
      resultado.animate([
        { transform: 'translateY(2rem) scale(.8,1.1)', opacity: 0 },
        { transform: 'translateY(-.6rem) scale(1.03,.97)', opacity: 1, offset: .5 },
        { transform: 'translateY(.15rem) scale(.99,1.01)', offset: .75 },
        { transform: 'none', opacity: 1 },
      ], { duration: 720, easing: 'ease-out' });
    }
  };
  $$('[data-grupo]').forEach(g => {
    const botones = $$('.opcion', g);
    botones.forEach(b => b.addEventListener('click', () => {
      const yaEstaba = b.getAttribute('aria-pressed') === 'true';
      botones.forEach(o => o.setAttribute('aria-pressed', 'false'));
      if (!yaEstaba) b.setAttribute('aria-pressed', 'true');
      elegido[g.dataset.grupo] = yaEstaba ? null : b.dataset.valor;
      brinca(b, .5);
      mezclar();
    }));
  });
  $('[data-otra]').addEventListener('click', () => {
    $$('.opcion').forEach(o => o.setAttribute('aria-pressed', 'false'));
    elegido.para = elegido.plan = null;
    mezclar();
    $('#formula').scrollIntoView({ behavior: calma ? 'auto' : 'smooth' });
  });

  /* ─── La pulsera de bolitas ─── */
  (() => {
    const svg = $('[data-pulsera]');
    // los nombres de estos colores están en idiomas.js, en el mismo orden
    const COLORES = ['#F62C04', '#FEBCD8', '#FFD45E', '#8FD3B4', '#3F6FD8', '#6E1533'];
    const NUM = 34, cx = 230, cy = 240, rx = 150, ry = 168;
    const pts = [];
    for (let i = 0; i < NUM; i++) {
      const a = -Math.PI / 2 + i / NUM * Math.PI * 2;
      // un poco de gota: la pulsera cuelga de la barra
      const estira = 1 + .1 * Math.max(0, Math.sin(a));
      pts.push([cx + Math.cos(a) * rx * (1 - .12 * Math.max(0, -Math.sin(a))), cy + Math.sin(a) * ry * estira]);
    }
    const cuerda = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + 'Z';
    svg.innerHTML =
      `<rect class="pulsera__barra" x="96" y="46" width="268" height="15" rx="7.5"/>` +
      `<g class="pulsera__todo"><path class="pulsera__cuerda" d="${cuerda}"/>` +
      pts.map((p, i) => `<g class="bola-g" style="--i:${i}"><circle class="bola" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="13.5"/><circle class="bola__brillo" cx="${(p[0] - 4).toFixed(1)}" cy="${(p[1] - 4.5).toFixed(1)}" r="3.4"/></g>`).join('') +
      `<use href="#destello" x="${cx - 21}" y="${cy + ry * 1.1 + 8}" width="42" height="42" fill="#F62C04" class="pulsera__dije"/>` +
      `</g>`;
    const bolas = $$('.bola', svg), grupos = $$('.bola-g', svg);
    let patron = ['#F62C04', '#FEBCD8', '#FEBCD8', '#FFD45E', '#8FD3B4'];
    const pintar = (ola = true) => {
      bolas.forEach((b, i) => {
        const c = patron[i % patron.length];
        if (ola && !calma && b.animate) {
          // la ola de color da la vuelta a la pulsera y cada bola da un saltito
          const r = (pts[i][0] - cx), s = (pts[i][1] - cy), m = Math.hypot(r, s) || 1;
          setTimeout(() => b.setAttribute('fill', c), i * 26);
          grupos[i].animate([
            { transform: 'none' },
            { transform: `translate(${(r / m * 13).toFixed(1)}px,${(s / m * 13).toFixed(1)}px)`, offset: .4 },
            { transform: `translate(${(-r / m * 3).toFixed(1)}px,${(-s / m * 3).toFixed(1)}px)`, offset: .72 },
            { transform: 'none' },
          ], { duration: 560, delay: i * 26, easing: 'ease-out' });
        } else b.setAttribute('fill', c);
      });
    };
    pintar(false);
    const caja = $('[data-muestras]');
    COLORES.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'muestra'; b.style.setProperty('--c', c);
      b.addEventListener('click', () => {
        patron = [...patron.slice(-3), c];
        pintar();
      });
      caja.append(b);
    });
    $('[data-sorpresa]').addEventListener('click', () => {
      const largo = 3 + Math.floor(Math.random() * 3);
      patron = Array.from({ length: largo }, () => COLORES[Math.floor(Math.random() * COLORES.length)]);
      pintar();
    });
    // salta sola la primera vez que se ve
    const miraPulsera = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { setTimeout(() => pintar(), 500); miraPulsera.disconnect(); }
    }, { threshold: .4 });
    miraPulsera.observe(svg);
  })();

  /* ─── Menú en móvil ─── */
  const bMenu = $('.menu-boton'), mMenu = $('#menu-movil');
  $$('a', mMenu).forEach((a, i) => a.style.setProperty('--i', i));
  const menu = abierto => {
    mMenu.hidden = !abierto;
    bMenu.setAttribute('aria-expanded', abierto);
    bMenu.textContent = abierto ? TEXTOS[idioma].cerrar : TEXTOS[idioma].menu;
    document.documentElement.style.overflow = abierto ? 'hidden' : '';
  };
  bMenu.addEventListener('click', () => menu(mMenu.hidden));
  $$('a', mMenu).forEach(a => a.addEventListener('click', () => menu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mMenu.hidden) { menu(false); bMenu.focus(); } });

  /* ─── Cambiar de idioma ─── */
  const traducir = () => {
    const T = TEXTOS[idioma], esBase = idioma === 'es';
    const de = (clave, base) => (esBase ? base : T[clave] ?? base);
    document.documentElement.lang = idioma;
    textosBase.forEach(({ el, clave, base }) => {
      const v = de(clave, base);
      if (el.hasAttribute('data-letras')) partirLetras(el, v);
      else if (el.hasAttribute('data-palabras')) partirPalabras(el, v);
      else el.innerHTML = v;
    });
    atributosBase.forEach(({ el, attr, clave, base }) => el.setAttribute(attr, de(clave, base)));
    $$('.hoja').forEach((h, i) => {
      const d = esBase ? hojasBase[i] : T.hojas[i];
      h.dataset.marca = d.marca; h.dataset.nombre = d.nombre; h.dataset.txt = d.txt;
      $('img', h).alt = d.alt;
      $('.hoja__boton', h).setAttribute('aria-label', d.aria);
      const info = $('.hoja__info', h);
      $('.ceja', info).textContent = d.marca;
      $('h3', info).textContent = d.nombre;
      $('p:last-child', info).textContent = d.txt;
    });
    partirTablero();
    if (rueda) rueda.refrescar();
    estado();
    pintarLab();
    $$('.muestra').forEach((b, i) => b.setAttribute('aria-label', T.anadir(T.colores[i])));
    bMenu.textContent = mMenu.hidden ? T.menu : T.cerrar;
    $('meta[name="description"]').content = esBase ? descBase : T.desc;
    const mapa = $('[data-mapa]');
    const src = mapa.src.replace(/hl=\w+/, `hl=${idioma}`);
    if (src !== mapa.src) mapa.src = src;
    $$('[data-lang]').forEach(a => {
      if (a.dataset.lang === idioma) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  // lo que se está viendo da un saltito al cambiar de idioma
  const saludar = () => {
    textosBase.forEach(({ el }) => {
      if (el.hasAttribute('data-letras') || el.hasAttribute('data-palabras')) return;
      const r = el.getBoundingClientRect();
      if (r.width && r.bottom > 0 && r.top < innerHeight) brinca(el, .22);
    });
  };
  $$('[data-lang]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const nuevo = a.dataset.lang;
    if (nuevo === idioma) return;
    idioma = nuevo;
    try { localStorage.setItem('idioma', nuevo); } catch (err) { /* sin almacenamiento, solo dura esta visita */ }
    const url = new URL(location.href);
    if (nuevo === 'es') url.searchParams.delete('lang'); else url.searchParams.set('lang', nuevo);
    history.replaceState(null, '', url);
    traducir();
    brinca(a, .5);
    saludar();
  }));
  traducir();
  document.documentElement.classList.remove('traduciendo');
})();
