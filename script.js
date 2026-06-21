document.addEventListener("DOMContentLoaded", () => {
  const bird = document.getElementById("bird");
  const doors = document.querySelectorAll(".door");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let birdX = mouseX;
  let birdY = mouseY;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateBird() {
    if (bird) {
      birdX += (mouseX - birdX) * 0.08;
      birdY += (mouseY - birdY) * 0.08;

      const dx = mouseX - birdX;
      const dy = mouseY - birdY;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      bird.style.left = `${birdX}px`;
      bird.style.top = `${birdY}px`;
      bird.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }

    requestAnimationFrame(animateBird);
  }

  animateBird();

  doors.forEach((door) => {
    door.addEventListener("mouseenter", () => {
      door.classList.add("open");
    });

    door.addEventListener("mouseleave", () => {
      door.classList.remove("open");
    });

    door.addEventListener("click", () => {
      door.classList.add("shake");
      setTimeout(() => door.classList.remove("shake"), 450);
    });
  });

  /* Gallery 初始化 */
  function initGalleries() {
    const galleries = document.querySelectorAll('.gallery');
    galleries.forEach(gallery => {
      let images = [];
      try {
        const raw = gallery.getAttribute('data-images');
        images = raw ? JSON.parse(raw) : [];
      } catch (e) { images = []; }

      const mainImg = gallery.querySelector('.gallery-main img');
      const thumbsEl = gallery.querySelector('.gallery-thumbs');
      const prevBtn = gallery.querySelector('.gallery-prev');
      const nextBtn = gallery.querySelector('.gallery-next');
      let idx = 0;

      function renderThumbs() {
        thumbsEl.innerHTML = '';
        images.forEach((src, i) => {
          const t = document.createElement('div');
          t.className = 'thumb' + (i===idx? ' active' : '');
          const im = document.createElement('img');
          im.src = src;
          im.alt = '';
          t.appendChild(im);
          t.addEventListener('click', () => { show(i); });
          thumbsEl.appendChild(t);
        });
      }

      function show(i) {
        if (!images[i]) return;
        idx = i;
        // fade effect
        mainImg.style.opacity = 0;
        setTimeout(() => {
          mainImg.src = images[idx];
          mainImg.style.opacity = 1;
        }, 160);
        // update thumbs
        const thumbNodes = thumbsEl.querySelectorAll('.thumb');
        thumbNodes.forEach((n, j) => n.classList.toggle('active', j===idx));
        // update custom handle position if present
        requestAnimationFrame(() => updateHandle());
      }

      function next() { show((idx + 1) % images.length); }
      function prev() { show((idx - 1 + images.length) % images.length); }

      if (prevBtn) prevBtn.addEventListener('click', prev);
      if (nextBtn) nextBtn.addEventListener('click', next);

      // drag/swipe support on main image
      let startX = 0;
      let isDown = false;
      mainImg.addEventListener('pointerdown', (e) => {
        isDown = true; startX = e.clientX;
        mainImg.setPointerCapture(e.pointerId);
      });
      mainImg.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        mainImg.style.transform = `translateX(${dx}px)`;
      });
      mainImg.addEventListener('pointerup', (e) => {
        if (!isDown) return; isDown = false;
        const dx = e.clientX - startX;
        mainImg.style.transform = '';
        if (dx < -40) next();
        else if (dx > 40) prev();
      });
      mainImg.addEventListener('pointercancel', () => { isDown = false; mainImg.style.transform = ''; });

      // keyboard left/right when gallery in viewport
      gallery.tabIndex = 0;
      gallery.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      });

      // initial render
      if (images.length) {
        renderThumbs();
        mainImg.src = images[0];
        // Only add the custom track/handle for restaurant galleries
        let track = null, trackBg = null, handle = null, boat = null;
        if (gallery.classList.contains('gallery--restaurant')) {
          // create custom track + handle for this gallery
          track = document.createElement('div'); track.className = 'gallery-track';
          trackBg = document.createElement('div'); trackBg.className = 'track-bg'; track.appendChild(trackBg);
          handle = document.createElement('div'); handle.className = 'gallery-handle';
          boat = document.createElement('div'); boat.className = 'boat';
          // build three puff elements for cloud shape
          const p1 = document.createElement('span'); p1.className = 'puff puff-left';
          const p2 = document.createElement('span'); p2.className = 'puff puff-center';
          const p3 = document.createElement('span'); p3.className = 'puff puff-right';
          boat.appendChild(p1); boat.appendChild(p2); boat.appendChild(p3);
          handle.appendChild(boat);
          track.appendChild(handle);
          gallery.appendChild(track);
        }

        // update handle position based on thumbs scroll
        function updateHandle() {
          if (!thumbsEl) return;
          if (!track || !handle) return; // no handle for non-restaurant galleries
          const scrollable = Math.max(0, thumbsEl.scrollWidth - thumbsEl.clientWidth);
          const bg = track.querySelector('.track-bg');
          const trackWidth = Math.max(1, (bg ? bg.clientWidth : track.clientWidth) - handle.clientWidth - 16);
          const ratio = scrollable ? (thumbsEl.scrollLeft / scrollable) : 0;
          const left = clamp(ratio * trackWidth, 0, trackWidth);
          handle.style.transform = `translate(${left}px, -50%)`;
        }

        // clamp helper
        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        // sync thumbs -> handle
        thumbsEl.addEventListener('scroll', () => {
          updateHandle();
        });

        // if this gallery created a track/handle (restaurant), wire up interactions
        if (track && handle) {
          // handle dragging -> thumbs scroll
          let dragging = false; let dragId = null;
          handle.addEventListener('pointerdown', (e) => {
            dragging = true; handle.setPointerCapture(e.pointerId); boat.classList.add('sail');
          });
          handle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const rect = (track.querySelector('.track-bg') || track).getBoundingClientRect();
            const handleW = handle.clientWidth;
            const x = e.clientX - rect.left - (handleW/2);
            const trackWidth = Math.max(1, rect.width - handleW - 16);
            const pct = clamp(x/trackWidth, 0, 1);
            const scrollable = Math.max(0, thumbsEl.scrollWidth - thumbsEl.clientWidth);
            thumbsEl.scrollLeft = pct * scrollable;
            updateHandle();
          });
          handle.addEventListener('pointerup', (e) => { dragging = false; try{ handle.releasePointerCapture(e.pointerId);}catch(e){} boat.classList.remove('sail'); });
          handle.addEventListener('pointercancel', () => { dragging = false; boat.classList.remove('sail'); });

          // click on track to jump
          track.addEventListener('click', (e) => {
            if (e.target === handle || handle.contains(e.target)) return;
            const rect = (track.querySelector('.track-bg') || track).getBoundingClientRect();
            const handleW = handle.clientWidth;
            const x = e.clientX - rect.left - (handleW/2);
            const trackWidth = Math.max(1, rect.width - handleW - 16);
            const pct = clamp(x/trackWidth, 0, 1);
            const scrollable = Math.max(0, thumbsEl.scrollWidth - thumbsEl.clientWidth);
            thumbsEl.scrollLeft = pct * scrollable;
            updateHandle();
          });

          // resize observer to update position
          const ro = new ResizeObserver(() => updateHandle());
          ro.observe(thumbsEl); ro.observe(track);
          // ensure thumbs start at center and handle at track middle
          requestAnimationFrame(() => {
            const scrollable = Math.max(0, thumbsEl.scrollWidth - thumbsEl.clientWidth);
            thumbsEl.scrollLeft = Math.round(scrollable / 2);
            updateHandle();
            try { handle.style.transform = 'translate(0px, -50%)'; } catch(e){}
          });
        } else {
          // no custom track: still observe thumbs for layout changes
          const ro = new ResizeObserver(() => updateHandle());
          ro.observe(thumbsEl);
          thumbsEl.scrollLeft = 0;
          requestAnimationFrame(() => updateHandle());
        }
      }
    });
  }

  initGalleries();
});