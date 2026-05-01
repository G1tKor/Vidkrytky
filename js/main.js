const table = document.getElementById('table');
const overlay = document.getElementById('overlay');
const viewer = document.getElementById('viewer');

let postcards = [];
let currentLang = 'original';
let zIndex = 1;

let activeCard = null;
let isAnimating = false;
let isInteracting = false;

const ANIMATION_DURATION = 600;

createRandomizeButton();

// загрузка JSON
fetch('data/postcards.json')
   .then(res => res.json())
   .then(data => {
      postcards = data;
      renderCards();
   });

// задержка перед стартом анимации каждой карточки
function getStaggerDelay(index) {
   return Math.random() * 150 + index * 40;
}

// универсальная проверка на активную открытку
function isAnimatingNow() {
   return isAnimating;
}

function isInteractingNow() {
   return isInteracting;
}

function setUIBusy(state) {
   document.body.classList.toggle('ui-busy', state);
}


// случайные открытки
function renderCards() {
   const shuffled = [...postcards]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

   let remaining = shuffled.length;

   if (remaining === 0) {
      setUIBusy(false);
      return;
   }

   const failSafe = setTimeout(() => {
      setUIBusy(false);
   }, ANIMATION_DURATION + 400); // чуть больше, чем длительность анимации

   shuffled.forEach((cardData, index) => {
      const card = createCard(cardData);

      table.appendChild(card);

      card.classList.add('animating'); // вкл transition

      const delay = getStaggerDelay(index);

      setTimeout(() => {
         card.style.setProperty('--y', '0px');
         card.style.setProperty('--x', '0px');
      }, delay);

      const handler = (e) => {
         if (e.propertyName !== 'transform') return;

         card.removeEventListener('transitionend', handler);

         card.classList.remove('animating');

         remaining--;

         if (remaining === 0) {
            clearTimeout(failSafe);
            setUIBusy(false);
         }
      };

      card.addEventListener('transitionend', handler);
   });
}



function createRandomizeButton() {
   const btn = document.createElement('button');
   btn.id = 'randomizeBtn';
   btn.classList.add('ui-button');
   btn.innerHTML = `
   <svg width="41" height="41" viewBox="0 0 41 41">
      <path d="M16.0049 5.94477L20.0872 10.0271M25.5301 2V7.77283M35.0552 5.94477L30.9729 10.0271M39 15.4699H33.2272M35.0552 24.9951L30.9729 20.9128M25.5301 28.9399V23.167M16.0049 24.9951L20.0872 20.9128M12.0601 15.4699H17.833M25.1317 15.8683L2 39" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
   </svg>
   <span>VIDKRYTKY</span>
`;

   btn.onclick = () => {
      if (!viewer.classList.contains('hidden')) return;
      if (isAnimatingNow() || isInteractingNow()) return;
      randomizeCards();
   };

   btn.addEventListener('touchstart', () => {
      btn.classList.add('is-pressed');
   });

   btn.addEventListener('touchend', () => {
      btn.classList.remove('is-pressed');
   });

   btn.addEventListener('touchcancel', () => {
      btn.classList.remove('is-pressed');
   });

   btn.addEventListener('mousedown', () => {
      btn.classList.add('is-pressed');
   });

   btn.addEventListener('mouseup', () => {
      btn.classList.remove('is-pressed');
   });

   btn.addEventListener('mouseleave', () => {
      btn.classList.remove('is-pressed');
   });

   document.body.appendChild(btn);
}


// создание карточки
function createCard(data) {
   const div = document.createElement('div');
   div.className = 'card';

   const img = document.createElement('img');
   img.src = `images/postcards/${data.image}`;
   div.appendChild(img);

   // случайная позиция
   div.style.top = Math.random() * 70 + '%';
   div.style.left = Math.random() * 70 + '%';

   const maxAngle = 42;    // угол случайного поворота
   const angle = Math.random() * (2 * maxAngle) - maxAngle;

   div.dataset.rotation = angle;

   const offsetX = (Math.random() - 0.5) * 200; // от -100px до +100px

   div.style.setProperty('--x', `${offsetX}px`);
   div.style.setProperty('--y', '120vh');
   div.style.setProperty('--rot', `${angle}deg`);

   enableInteraction(div, data);

   return div;
}

function randomizeCards() {
   if (isAnimatingNow() || isInteractingNow()) return;

   setUIBusy(true);

   const cards = table.querySelectorAll('.card');

   cards.forEach((card, index) => {
      const delay = getStaggerDelay(index);

      setTimeout(() => {
         card.classList.add('animating'); // вкл transition

         card.style.setProperty('--x', '0vw');
         card.style.setProperty('--y', '120vh'); // вниз
         card.style.opacity = '0';
      }, delay);
   });

   setTimeout(() => {
      table.innerHTML = '';
      renderCards();
   }, ANIMATION_DURATION + 200); // время смахивания старых открыток
}


// задняя сторона
function createBack(data) {
   const div = document.createElement('div');
   div.className = 'card-back';

   div.innerHTML = `
      <div class="back-inner">

         <div class="back-left">
            <div class="lang-switch">
               <div class="lang-buttons">
                   <button data-lang="original">Original</button>
                  <button data-lang="ua">UA</button>
                  <button data-lang="en">ENG</button>
               </div>

               <button class="close-btn">✕</button>
            </div>

            <div class="story"></div>
            <div class="author"></div>
         </div>

         <div class="back-right">
            <div class="city"></div>

            <div class="meta">
               <div class="id"></div>
               <div class="year"></div>
            </div>
         </div>

      </div>
   `;

   const storyEl = div.querySelector('.story');
   const authorEl = div.querySelector('.author');
   const cityEl = div.querySelector('.city');
   const idEl = div.querySelector('.id');
   const yearEl = div.querySelector('.year');

   const langButtons = div.querySelectorAll('.lang-buttons button');

   const closeBtn = div.querySelector('.close-btn');
   closeBtn.onclick = () => {
      closeViewer();
   };

   function getSafeLang(data, lang) {
      if (data.text[lang]) return lang;
      return 'original';
   }

   function updateContent() {
      const safeLang = getSafeLang(data, currentLang);

      storyEl.textContent = data.text[safeLang] || '';
      authorEl.textContent = data.author[safeLang] || '';


      const fullCity = data.hometown[safeLang] || '';

      const match = fullCity.match(/^(.*?)\s*\((.*?)\)$/);

      if (match) {
         const name = match[1];
         const region = match[2];

         cityEl.innerHTML = `
      <div class="city-name">${name}</div>
      <div class="city-region">(${region})</div>
   `;
      } else {
         cityEl.textContent = fullCity;
      }


      idEl.textContent = data.id;
      yearEl.textContent = data.year;

      // ПОДСВЕТКА ТУТ
      langButtons.forEach(btn => {
         btn.classList.remove('active');

         if (btn.dataset.lang === safeLang) {
            btn.classList.add('active');
         }
      });
   }

   // отключаем недоступные языки
   langButtons.forEach(btn => {
      const lang = btn.dataset.lang;

      if (!data.text[lang]) {
         btn.disabled = true;
      }

      btn.onclick = () => {
         currentLang = lang;
         updateContent();
      };
   });

   updateContent();

   // определяем четность открытки
   const isEven = Number(data.id) % 2 === 0;
   div.classList.add(isEven ? 'theme-even' : 'theme-odd');

   return div;
}


// drag // клик / открытие
function enableInteraction(el, data) {
   let isDragging = false;    // сейчас тащим
   let moved = false;      // было ли движение (чтобы отличить клик)
   let startX = 0;      // точка начала drag
   let startY = 0;      // точка начала drag

   let isRotating = false;    // сейчас крутим
   let startAngle = 0;     // угол между пальцами в начале rotate
   let currentRotation = parseFloat(el.dataset.rotation) || 0;    // текущий угол карточки

   let wasRotating = false;      // был ли rotate (чтобы не открыть карточку)
   let rotationBase = 0;      // угол до нового вращения

   function getPos(e) {    // получить позицию (мышь / тач)
      if (e.touches) {
         return {
            x: e.touches[0].clientX,     // мышь: clientX/Y, тач: touches[0]
            y: e.touches[0].clientY
         };
      }
      return {
         x: e.clientX,
         y: e.clientY
      };
   }

   function getAngle(touch1, touch2) {    // Считает угол между двумя пальцами
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.atan2(dy, dx) * (180 / Math.PI);
   }

   function startInteraction(el) {
      activeCard = el;

      isInteracting = true;

      el.classList.add('is-dragging');
      document.body.classList.add('dragging');

      setUIBusy(true);

      el.style.zIndex = ++zIndex;
   }

   function onMove(e) {    // обработка движения: drag и rotate

      if (e.touches && e.touches.length === 2 && !isRotating) {   // вход в rotate, два пальца обнаружены
         isDragging = false;
         isRotating = true;

         wasRotating = true;
         moved = false; // ВАЖНО

         rotationBase = currentRotation;

         startAngle = getAngle(e.touches[0], e.touches[1]);
      }

      if (!isDragging && !isRotating) return;

      if (isRotating && e.touches && e.touches.length === 2) {    // уже вращаем и всё ещё 2 пальца на экране
         e.preventDefault();

         const angle = getAngle(e.touches[0], e.touches[1]);
         const delta = angle - startAngle;

         currentRotation = rotationBase + delta;
         el.style.setProperty('--rot', `${currentRotation}deg`);

         return;
      }

      // потом drag
      if (e.touches) e.preventDefault();

      const pos = getPos(e);

      const dx = pos.x - startX;
      const dy = pos.y - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
         moved = true;

         el.style.left = el.offsetLeft + dx + 'px';
         el.style.top = el.offsetTop + dy + 'px';

         startX = pos.x;
         startY = pos.y;
      }
   }


   function onUp(e) {      // завершение жеста (или клика)

      // если это touch и остался 1 палец — продолжаем drag
      if (e.touches && e.touches.length === 1) {
         isRotating = false;
         isDragging = true;

         const pos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
         };

         startX = pos.x;
         startY = pos.y;

         return; // НЕ завершаем взаимодействие
      }

      isDragging = false;
      isRotating = false;

      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      document.removeEventListener('touchmove', onMove, { passive: false });
      document.removeEventListener('touchend', onUp);

      if (!moved && !wasRotating) {
         openCard(el, data);
      }

      wasRotating = false;

      activeCard = null;   // освобождаем activeCard
      isInteracting = false;

      el.classList.remove('is-dragging');
      document.body.classList.remove('dragging');

      setUIBusy(false);
   }

   el.addEventListener('mousedown', e => {      // старт drag (мышь)
      if (activeCard && activeCard !== el) return;

      e.preventDefault();

      startInteraction(el);

      isDragging = true;
      isRotating = false;
      moved = false;

      startX = e.clientX;
      startY = e.clientY;

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
   });

   el.addEventListener('touchstart', e => {     // старт drag / rotate (тач)
      if (activeCard && activeCard !== el) return;  // захват карточки

      e.preventDefault();

      startInteraction(el);

      if (e.touches.length === 1) {    // обычный drag (1 палец)
         const pos = getPos(e);
         e.preventDefault();

         isDragging = true;
         isRotating = false;
         moved = false;

         startX = pos.x;
         startY = pos.y;

      } else if (e.touches.length === 2) {   // вращение (2 пальца)
         e.preventDefault();

         isDragging = false;
         isRotating = true;

         wasRotating = true;

         rotationBase = currentRotation;
         startAngle = getAngle(e.touches[0], e.touches[1]);
      }

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
   });
}

// открытие
function openCard(el, data) {
   if (isAnimatingNow()) return;

   overlay.classList.remove('hidden');
   viewer.classList.remove('hidden');

   viewer.scrollTop = 0;      // сброс скролла при открытии

   viewer.innerHTML = '';

   const container = document.createElement('div');
   container.className = 'viewer-content';

   const img = document.createElement('img');
   img.src = `images/postcards/${data.image}`;

   const back = createBack(data);

   const imgWrapper = document.createElement('div');
   imgWrapper.className = 'img-wrapper';

   const backWrapper = document.createElement('div');
   backWrapper.className = 'back-wrapper';

   imgWrapper.appendChild(img);
   backWrapper.appendChild(back);

   container.appendChild(imgWrapper);
   container.appendChild(backWrapper);

   viewer.appendChild(container);

   // закрытие по клику вне карточки
   viewer.onclick = (e) => {
      const clickedImage = e.target.closest('.img-wrapper');
      const clickedBack = e.target.closest('.card-back');

      if (!clickedImage && !clickedBack) {
         closeViewer();
      }
   };
}

function closeViewer() {
   overlay.classList.add('hidden');
   viewer.classList.add('hidden');
   viewer.innerHTML = '';
}

