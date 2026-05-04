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
   <svg width="39" height="37" viewBox="0 0 39 37" fill="currentColor">
      <path d="M25.6659 34.9399C25.6659 35.485 25.4493 36.0078 25.0639 36.3932C24.6784 36.7787 24.1557 36.9952 23.6106 36.9952L21.5553 36.9952C17.1945 36.9952 13.0123 35.2629 9.92881 32.1794C6.84528 29.0958 5.11297 24.9137 5.11297 20.5529L5.11297 13.1826L3.48313 14.8125C3.0955 15.1869 2.57632 15.394 2.03743 15.3893C1.49854 15.3847 0.983051 15.1685 0.601984 14.7874C0.220916 14.4064 0.00476211 13.8909 7.93195e-05 13.352C-0.00460347 12.8131 0.202558 12.2939 0.576946 11.9063L5.70695 6.77629C6.02093 6.45818 6.43005 6.2511 6.8723 6.18642L7.18676 6.16587C7.66736 6.16993 8.13134 6.34228 8.49803 6.65297L8.62135 6.76807L13.7596 11.9063C14.134 12.2939 14.3411 12.8131 14.3364 13.352C14.3318 13.8909 14.1156 14.4064 13.7345 14.7874C13.3535 15.1685 12.838 15.3847 12.2991 15.3893C11.7602 15.394 11.241 15.1869 10.8534 14.8125L9.22355 13.1826L9.22355 20.5529C9.22355 23.8235 10.5228 26.9601 12.8354 29.2728C15.1481 31.5854 18.2847 32.8846 21.5553 32.8846L23.6106 32.8846C24.1557 32.8846 24.6784 33.1012 25.0639 33.4866C25.4493 33.8721 25.6659 34.3948 25.6659 34.9399ZM38.4231 25.0889L33.2848 30.2272C32.8994 30.6125 32.3767 30.8289 31.8317 30.8289C31.2868 30.8289 30.7641 30.6125 30.3786 30.2272L25.2404 25.0889C25.0441 24.8993 24.8875 24.6725 24.7798 24.4218C24.6721 24.171 24.6154 23.9013 24.613 23.6284C24.6107 23.3555 24.6627 23.0849 24.766 22.8323C24.8694 22.5797 25.022 22.3502 25.215 22.1573C25.4079 21.9643 25.6374 21.8117 25.89 21.7083C26.1426 21.605 26.4132 21.553 26.6861 21.5554C26.959 21.5577 27.2287 21.6144 27.4795 21.7222C27.7302 21.8299 27.957 21.9864 28.1466 22.1827L29.7764 23.8126L29.7764 16.4423C29.7765 13.1717 28.4772 10.0351 26.1646 7.72246C23.8519 5.40981 20.7153 4.11058 17.4447 4.11058L15.3894 4.11058C14.8443 4.11058 14.3216 3.89404 13.9361 3.5086C13.5507 3.12316 13.3341 2.60039 13.3341 2.05529C13.3341 1.51019 13.5507 0.987421 13.9361 0.601979C14.3216 0.216538 14.8443 -1.05588e-06 15.3894 -1.03205e-06L17.4447 -9.42212e-07C21.8055 -7.51596e-07 25.9877 1.73231 29.0712 4.81584C32.1547 7.89938 33.887 12.0815 33.887 16.4423L33.887 23.8126L35.5169 22.1827C35.9045 21.8084 36.4237 21.6012 36.9626 21.6059C37.5015 21.6106 38.017 21.8267 38.398 22.2078C38.7791 22.5889 38.9952 23.1043 38.9999 23.6432C39.0046 24.1821 38.7974 24.7013 38.4231 25.0889Z"/>
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

