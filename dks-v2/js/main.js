const PHONE = "22890184623";
const $ = (s) => document.querySelector(s);
const fmt = (n) => n.toLocaleString("fr-FR") + " F";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Données ---------- */
const DISHES = [
  {
    id: "ayimolou",
    name: "Ayimolou",
    cat: "Riz",
    img: "images/ayimolou.jpg",
    desc: "Riz-haricots, sauce rouge, œuf et poisson frit.",
  },
  {
    id: "riz",
    name: "Riz sauté au poulet",
    cat: "Riz",
    img: "images/riz.jpg",
    desc: "Riz sauté aux petits légumes et morceaux de poulet.",
  },
  {
    id: "attieke",
    name: "Attiéké et poisson frit",
    cat: "Attiéké",
    img: "images/attieke.jpg",
    desc: "Attiéké, poisson frit, oignons et piment frais.",
  },
  {
    id: "pate",
    name: "Pâte rouge et poulet grillé",
    cat: "Pâte",
    img: "images/pate.jpg",
    desc: "Pâte rouge, poulet grillé et salade de piment.",
  },
  {
    id: "spag-poulet",
    name: "Spaghettis au poulet",
    cat: "Spaghettis",
    img: "images/spaghettis-poulet.jpg",
    desc: "Spaghettis en sauce, poulet doré.",
  },
  {
    id: "spag-omelette",
    name: "Spaghettis à l’omelette",
    cat: "Spaghettis",
    img: "images/spaghettis-omelette.jpg",
    desc: "Spaghettis aux légumes et omelette.",
  },
  {
    id: "sandwich",
    name: "Sandwich + Jus",
    cat: "En-cas",
    img: "images/sandwich.jpg",
    desc: "Pain frais, thon, crudités. Servi avec un jus.",
  },
];
const RV = { 1: "Ayimolou", 4: "Sandwich + jus", 5: "Attiéké" };
const DAYS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

/* ---------- Menu mobile, progression, année ---------- */
const burger = $(".burger"),
  menu = $("#menu");
burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
});
addEventListener(
  "scroll",
  () => {
    const h = document.documentElement;
    $("#progress").style.width =
      (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
  },
  { passive: true },
);
$("#year").textContent = new Date().getFullYear();

/* ---------- Rendez-vous du jour ---------- */
(function () {
  const d = new Date().getDay();
  let next = null,
    wait = 0;
  if (!RV[d])
    for (let i = 1; i <= 7; i++) {
      const n = (d + i) % 7;
      if (RV[n]) {
        next = n;
        wait = i;
        break;
      }
    }
  const banner = $("#banner span");
  if (RV[d]) banner.textContent = "Aujourd’hui : " + RV[d].toLowerCase();
  else
    banner.textContent =
      "Prochain rendez-vous : " +
      RV[next].toLowerCase() +
      (wait === 1 ? " demain" : " " + DAYS_FR[next]);
  document.querySelectorAll(".day").forEach((c) => {
    const n = Number(c.dataset.day);
    if (n === d) {
      c.classList.add("today");
      c.dataset.tag = "Aujourd’hui";
    } else if (n === next)
      c.dataset.tag = wait === 1 ? "Demain" : "Dans " + wait + " jours";
  });
})();

/* ---------- Compteur 1000 ---------- */
(function () {
  const el = $("#count"),
    to = +el.dataset.to;
  if (reduce) return;
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 1300, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
})();

/* ---------- Apparition au défilement ---------- */
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- Panier ---------- */
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem("dks-cart")) || {};
} catch (e) {}
const save = () => {
  try {
    localStorage.setItem("dks-cart", JSON.stringify(cart));
  } catch (e) {}
};
const dish = (id) => DISHES.find((d) => d.id === id);
const entries = () =>
  Object.entries(cart)
    .map(([k, q]) => {
      const [id, price] = k.split("|");
      return { k, q, d: dish(id), price: +price };
    })
    .filter((x) => x.d);
const total = () => entries().reduce((s, x) => s + x.q * x.price, 0);
const count = () => entries().reduce((s, x) => s + x.q, 0);

let toastT;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 1800);
}

function add(id, price) {
  const k = id + "|" + price;
  cart[k] = (cart[k] || 0) + 1;
  save();
  refresh();
  const portion =
    price === 500 && id !== "sandwich"
      ? " (Petite)"
      : price === 1000
        ? " (Grande)"
        : "";
  toast("Ajouté : " + dish(id).name + portion);
  const f = $("#cart-bar");
  f.classList.remove("bump");
  void f.offsetWidth;
  f.classList.add("bump"); // Animation de la barre
}
function refresh() {
  const n = count(),
    bar = $("#cart-bar");
  bar.hidden = n === 0;
  if (bar) {
    $("#bar-n").textContent = n;
    $("#bar-t").textContent = fmt(total());
  }
  if ($("#cart").open) renderCart();
}

/* ---------- Grille de plats + filtres ---------- */
let current = DISHES;
const cats = ["Tous", ...new Set(DISHES.map((d) => d.cat))];
$("#chips").innerHTML = cats
  .map(
    (c, i) =>
      `<button class="chip" aria-pressed="${i === 0}" data-c="${c}">${c}</button>`,
  )
  .join("");
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  document
    .querySelectorAll(".chip")
    .forEach((x) => x.setAttribute("aria-pressed", x === b));
  renderGrid(b.dataset.c);
});

function renderGrid(c = "Tous") {
  current = c === "Tous" ? DISHES : DISHES.filter((d) => d.cat === c);
  $("#grid").innerHTML = current
    .map((d, i) => {
      // Si c'est le sandwich (pas de choix de portion), on affiche un seul bouton
      const isSandwich = d.id === "sandwich";
      const buttons = isSandwich
        ? `<button data-id="${d.id}" data-p="500">+ 500 F</button>`
        : `<button data-id="${d.id}" data-p="500">+ Petite</button><button data-id="${d.id}" data-p="1000">+ Grande</button>`;

      const priceLine = isSandwich
        ? `<p class="price-line"><b>500 F</b></p>`
        : `<p class="price-line"><b>Petite : 500 F</b> ou <b>Grande : 1000 F</b></p>`;

      return `
    <article class="dish" style="animation-delay:${i * 70}ms">
      <div class="ph"><img src="${d.img}" alt="${d.name}" data-i="${i}" loading="lazy"></div>
      <div class="body">
        <h3>${d.name}</h3>
        ${priceLine}
        <p>${d.desc}</p>
        <div class="add" style="${isSandwich ? "grid-template-columns: 1fr;" : ""}">
          ${buttons}
        </div>
      </div>
    </article>`;
    })
    .join("");
}

$("#grid").addEventListener("click", (e) => {
  const b = e.target.closest(".add button");
  if (b) return add(b.dataset.id, +b.dataset.p);
  const im = e.target.closest("img");
  if (im) openBox(+im.dataset.i);
});
renderGrid();

/* ---------- Photo agrandie (flèches, clavier, balayage) ---------- */
const box = $("#lightbox");
let bi = 0;
function showBox() {
  const d = current[bi];
  box.querySelector("img").src = d.img;
  box.querySelector("img").alt = d.name;
  box.querySelector("p").textContent = d.name;
}
function openBox(i) {
  bi = i;
  showBox();
  box.showModal();
}
const go = (s) => {
  bi = (bi + s + current.length) % current.length;
  showBox();
};
box.querySelector(".prev").onclick = () => go(-1);
box.querySelector(".next").onclick = () => go(1);
box.querySelector(".close").onclick = () => box.close();
box.addEventListener("click", (e) => {
  if (e.target === box) box.close();
});
box.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") go(-1);
  if (e.key === "ArrowRight") go(1);
});
let sx = 0;
box.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), {
  passive: true,
});
box.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - sx;
  if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
});

/* ---------- Fenêtre panier ---------- */
const cartBox = $("#cart");
function renderCart() {
  const es = entries();
  $("#lines").innerHTML = es.length
    ? es
        .map((x) => {
          let portionText = "";
          if (x.d.id !== "sandwich") {
            portionText = x.price === 500 ? "Petite portion" : "Grande portion";
            portionText += " · ";
          }
          return `
    <li><span class="nm">${x.d.name}</span><span class="sub">${portionText}${fmt(x.q * x.price)}</span>
    <span class="stepper"><button data-k="${x.k}" data-s="-1" aria-label="Retirer un">−</button><b>${x.q}</b><button data-k="${x.k}" data-s="1" aria-label="Ajouter un">+</button></span></li>`;
        })
        .join("")
    : '<li class="empty">Votre panier est vide.</li>';
  $("#total").textContent = fmt(total());

  const mode =
    document.querySelector("input[name=mode]:checked")?.value || "emporter";
  const liv = mode === "livraison";
  $("#place-wrap").hidden = !liv;
  const low = liv && total() < 500;
  $("#warn").hidden = !low;
  $("#send").disabled = es.length === 0 || low;
}
$("#bar-open").onclick = () => {
  renderCart();
  cartBox.showModal();
};
cartBox.querySelector(".close").onclick = () => cartBox.close();
cartBox.addEventListener("click", (e) => {
  if (e.target === cartBox) cartBox.close();
});
$("#lines").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  cart[b.dataset.k] = (cart[b.dataset.k] || 0) + Number(b.dataset.s);
  if (cart[b.dataset.k] <= 0) delete cart[b.dataset.k];
  save();
  refresh();
  if (!count()) cartBox.close();
});
document
  .querySelectorAll("input[name=mode]")
  .forEach((r) => r.addEventListener("change", renderCart));
$("#clear").onclick = () => {
  cart = {};
  save();
  refresh();
  cartBox.close();
};

/* ---------- Envoi WhatsApp ---------- */
$("#send").onclick = () => {
  const mode =
    document.querySelector("input[name=mode]:checked")?.value || "emporter";
  const liv = mode === "livraison";
  const name = $("#name").value.trim() || "Client";
  const place = $("#place").value.trim();

  const ref = "DKS-" + Math.floor(1000 + Math.random() * 9000);

  // Mise en forme "Reçu" pour le message WhatsApp
  const lines = entries()
    .map((x) => {
      let portion = "";
      if (x.d.id !== "sandwich") {
        portion = x.price === 500 ? " (Petite)" : " (Grande)";
      }
      return `▪️ ${x.q} × ${x.d.name}${portion}`;
    })
    .join("\n");

  const msg =
    `*NOUVELLE COMMANDE ${ref}* 🍽️\n\n` +
    `👤 *Client :* ${name}\n` +
    `📍 *Mode :* ${liv ? "Livraison sur le campus" : "À emporter / Sur place"}\n` +
    (liv && place ? `🏢 *Lieu :* ${place}\n` : "") +
    `\n📋 *Détail de la commande :*\n${lines}\n\n` +
    `💰 *TOTAL À PAYER : ${fmt(total())}*\n\n` +
    `_Merci pour votre commande !_ 🙏`;

  window.open(
    `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`,
    "_blank",
    "noopener",
  );
};

refresh();
