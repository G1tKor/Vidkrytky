const table = document.getElementById('table');
const overlay = document.getElementById('overlay');

let postcards = [];
let currentLang = 'original';
let zIndex = 1;

let activeCard = null;

// загрузка JSON
fetch('data/postcards.json')
   .then(res => res.json())
   .then(data => {
      postcards = data;
      renderCards();
   });

// случайные открытки
function renderCards() {
   const shuffled = postcards.sort(() => 0.5 - Math.random()).slice(0, 10);

   shuffled.forEach(cardData => {
      const card = createCard(cardData);
      table.appendChild(card);
   });
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


   const angle = Math.random() * 60 - 30;

   div.style.transform = `rotate(${angle}deg)`;
   div.dataset.rotation = angle;

   enableInteraction(div, data);

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

   function onMove(e) {    // обработка движения: drag и rotate

      if (e.touches && e.touches.length === 2 && !isRotating) {   // вход в rotate, два пальца
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
         el.style.transform = `rotate(${currentRotation}deg)`;

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

      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);

      if (!moved && !wasRotating) {
         openCard(el, data);
      }

      wasRotating = false;

      activeCard = null;   // освобождаем activeCard
   }

   el.addEventListener('mousedown', e => {      // старт drag (мышь)
      if (activeCard && activeCard !== el) return;    // захват карточки
      activeCard = el;

      e.preventDefault();

      isDragging = true;
      moved = false;

      startX = e.clientX;
      startY = e.clientY;

      el.style.zIndex = ++zIndex;

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
   });

   el.addEventListener('touchstart', e => {     // старт drag / rotate (тач)
      if (activeCard && activeCard !== el) return;  // захват карточки
      activeCard = el;

      e.preventDefault();

      if (e.touches.length === 1) {    // обычный drag (1 палец)
         const pos = getPos(e);

         isDragging = true;
         isRotating = false;
         moved = false;

         startX = pos.x;
         startY = pos.y;

      } else if (e.touches.length === 2) {   // вращение (2 пальца)
         isDragging = false;
         isRotating = true;

         wasRotating = true;

         rotationBase = currentRotation;
         startAngle = getAngle(e.touches[0], e.touches[1]);
      }

      el.style.zIndex = ++zIndex;

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
   });
}

// открытие
const viewer = document.getElementById('viewer');

function openCard(el, data) {
   overlay.classList.remove('hidden');
   viewer.classList.remove('hidden');

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

   // 👉 закрытие по клику вне карточки
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

// закрытие
function closeCard(el, back) {
   overlay.classList.add('hidden');
   el.classList.remove('opened');
   el.removeChild(back);
}

// задняя сторона
function createBack(data) {
   const div = document.createElement('div');
   div.className = 'card-back';

   div.innerHTML = `
      <div class="back-inner">

         <div class="back-left">
            <div class="lang-switch">
               <button data-lang="original">Original</button>
               <button data-lang="ua">UA</button>
               <button data-lang="en">ENG</button>
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

   const buttons = div.querySelectorAll('.lang-switch button'); // ПЕРЕНЕСЛИ ВВЕРХ

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
      buttons.forEach(btn => {
         btn.classList.remove('active');

         if (btn.dataset.lang === safeLang) {
            btn.classList.add('active');
         }
      });
   }

   // отключаем недоступные языки
   buttons.forEach(btn => {
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

   return div;
}