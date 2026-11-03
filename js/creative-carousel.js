/*
*   Solutions / Creative — Video carousel (Relume Gallery 15 shell + Swiper)
*   Ref behaviour: quickframe.com hero
*   - centred infinite loop, active slide full size + playing, neighbours scaled to 0.86 + dimmed
*   - active Wistia video plays muted; when it ends the carousel advances
*   - only the active video plays; everything pauses when the section is off-screen
*
*   Webflow markup (classes):
*   section_gallery15 [data-creative-carousel]
*     .gallery15_component
*       .gallery15_slider            (.swiper)
*         .gallery15_list            (.swiper-wrapper)
*           .gallery15_slide         (.swiper-slide) [data-media-id="xxxx"] [data-title="Client"]
*             .gallery15_slide-inner
*               .gallery15_video     (empty div, player is injected here)
*               .gallery15_overlay
*       .gallery15_arrow.is-prev / .gallery15_arrow.is-next   (button / link block)
*       .gallery15_pagination        (empty div, dots are rendered here)
*/

const WISTIA_PLAYER_SRC = 'https://fast.wistia.com/player.js';
const SIDE_SCALE = 602 / 700;      // Figma: side slide 602x337 vs active 700x392
const FALLBACK_DELAY = 40000;      // advance anyway if a video never fires "ended"

// Accepts a bare Wistia media ID or any Wistia media/embed URL, e.g.
// f362186hvi | https://nld.wistia.com/medias/f362186hvi | https://fast.wistia.net/embed/iframe/f362186hvi
function parseWistiaId(value) {
    if (!value) return null;
    const v = value.trim();
    if (/^[a-z0-9]{10}$/i.test(v)) return v;
    const m = v.match(/(?:medias|iframe|embed\/medias)\/([a-z0-9]{10})/i) || v.match(/wvideo=([a-z0-9]{10})/i);
    return m ? m[1] : null;
}

function loadWistia() {
    if (window.__wistiaPlayerPromise) return window.__wistiaPlayerPromise;
    window.__wistiaPlayerPromise = new Promise((resolve) => {
        if (!document.querySelector(`script[src="${WISTIA_PLAYER_SRC}"]`)) {
            const s = document.createElement('script');
            s.src = WISTIA_PLAYER_SRC;
            s.async = true;
            document.head.appendChild(s);
        }
        customElements.whenDefined('wistia-player').then(resolve);
    });
    return window.__wistiaPlayerPromise;
}

function createPlayer(slide) {
    const host = slide.querySelector('.gallery15_video');
    const mediaId = slide.dataset.wistiaId;
    if (!host || !mediaId || host.querySelector('wistia-player')) return host?.querySelector('wistia-player');

    const player = document.createElement('wistia-player');
    const attrs = {
        'media-id': mediaId,
        'muted': '',
        'silent-autoplay': 'true',
        'preload': 'none',
        'fit-strategy': 'cover',
        'big-play-button': 'false',
        'controls-visible-on-load': 'false',
        'play-bar-control': 'false',
        'play-pause-control': 'false',
        'play-pause-notifier': 'false',
        'volume-control': 'false',
        'fullscreen-control': 'false',
        'settings-control': 'false',
        'seo': 'false',
        'swatch': 'true',
    };
    Object.entries(attrs).forEach(([k, v]) => player.setAttribute(k, v));
    host.appendChild(player);
    return player;
}

export function creativeCarousel() {
    const sections = document.querySelectorAll('[data-creative-carousel]');
    if (!sections.length || typeof Swiper === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sections.forEach((section) => {
        const sliderEl = section.querySelector('.gallery15_slider');
        const wrapper = section.querySelector('.gallery15_list');
        const paginationEl = section.querySelector('.gallery15_pagination');
        const prevBtn = section.querySelector('.gallery15_arrow.is-prev');
        const nextBtn = section.querySelector('.gallery15_arrow.is-next');
        if (!sliderEl || !wrapper) return;

        // resolve media IDs (static: data-media-id, CMS: data-wistia-url) and drop slides without a valid video
        [...wrapper.querySelectorAll('.gallery15_slide')].forEach((s) => {
            const id = parseWistiaId(s.dataset.mediaId || s.dataset.wistiaUrl);
            if (id) {
                s.dataset.wistiaId = id;
            } else {
                console.warn('creativeCarousel: no valid Wistia media ID on slide, removing it', s);
                s.remove();
            }
        });

        const originals = [...wrapper.querySelectorAll('.gallery15_slide')];
        const count = originals.length;
        if (!count) return;

        // tag originals and duplicate the set until there are enough slides for a seamless centred loop
        originals.forEach((s, i) => (s.dataset.index = i));
        let copies = 0;
        while (wrapper.children.length < 8 && copies < 3) {
            originals.forEach((s) => {
                const clone = s.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                wrapper.appendChild(clone);
            });
            copies++;
        }

        // dots
        const dots = [];
        if (paginationEl) {
            paginationEl.innerHTML = '';
            originals.forEach((s, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'gallery15_dot';
                b.setAttribute('aria-label', `Show video ${i + 1}${s.dataset.title ? ` – ${s.dataset.title}` : ''}`);
                b.addEventListener('click', () => goToOriginal(i));
                paginationEl.appendChild(b);
                dots.push(b);
            });
        }

        let inView = false;
        let fallbackTimer = null;
        let playersReady = false;

        const swiper = new Swiper(sliderEl, {
            slidesPerView: 'auto',
            centeredSlides: true,
            loop: true,
            loopedSlides: wrapper.children.length,      // Swiper 8
            loopAdditionalSlides: 2,                    // Swiper 9+
            spaceBetween: 12,
            speed: reduceMotion ? 0 : 800,
            grabCursor: true,
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            keyboard: { enabled: true, onlyInViewport: true },
            a11y: { enabled: true },
            breakpoints: {
                768: { spaceBetween: 24 },
                992: { spaceBetween: 32 },
            },
            on: {
                progress(sw) { applyDepth(sw); },
                setTranslate(sw) { applyDepth(sw); },
                setTransition(sw, duration) {
                    sw.slides.forEach((slide) => {
                        const inner = slide.querySelector('.gallery15_slide-inner');
                        const overlay = slide.querySelector('.gallery15_overlay');
                        if (inner) inner.style.transitionDuration = `${duration}ms`;
                        if (overlay) overlay.style.transitionDuration = `${duration}ms`;
                    });
                },
                slideChange(sw) { updateDots(sw); },
                slideChangeTransitionEnd() { syncPlayback(); },
            },
        });

        prevBtn?.addEventListener('click', (e) => { e.preventDefault(); swiper.slidePrev(); });
        nextBtn?.addEventListener('click', (e) => { e.preventDefault(); swiper.slideNext(); });

        // scale + dim neighbours by progress (smooth while dragging)
        function applyDepth(sw) {
            sw.slides.forEach((slide) => {
                const p = Math.max(-1, Math.min(1, slide.progress || 0));
                const a = Math.abs(p);
                const inner = slide.querySelector('.gallery15_slide-inner');
                const overlay = slide.querySelector('.gallery15_overlay');
                if (inner) {
                    inner.style.transform = `scale(${1 - (1 - SIDE_SCALE) * a})`;
                    // scale toward the active slide so the visual gap stays constant
                    inner.style.transformOrigin = p > 0 ? 'right center' : 'left center';
                }
                if (overlay) overlay.style.opacity = a;
                slide.classList.toggle('is-active', a < 0.5);
            });
        }

        function realOriginalIndex(slide) {
            return Number(slide?.dataset.index ?? 0) % count;
        }

        function updateDots(sw) {
            const idx = realOriginalIndex(sw.slides[sw.activeIndex]);
            dots.forEach((d, i) => {
                d.classList.toggle('is-active', i === idx);
                d.setAttribute('aria-current', i === idx ? 'true' : 'false');
            });
        }

        function goToOriginal(i) {
            // pick the nearest DOM slide that represents original i
            const candidates = swiper.slides
                .map((s, domIdx) => ({ s, domIdx }))
                .filter(({ s }) => realOriginalIndex(s) === i);
            const nearest = candidates.sort(
                (a, b) => Math.abs(a.domIdx - swiper.activeIndex) - Math.abs(b.domIdx - swiper.activeIndex)
            )[0];
            if (nearest) swiper.slideTo(nearest.domIdx);
        }

        function syncPlayback() {
            clearTimeout(fallbackTimer);
            if (!playersReady) return;
            const active = swiper.slides[swiper.activeIndex];

            swiper.slides.forEach((slide) => {
                const player = slide.querySelector('wistia-player');
                if (!player || slide === active) return;
                try { player.pause(); player.currentTime = 0; } catch (e) {}
            });

            if (!inView || reduceMotion) return;
            const player = createPlayer(active);
            if (!player) return;
            try { player.play(); } catch (e) {}
            fallbackTimer = setTimeout(() => swiper.slideNext(), FALLBACK_DELAY);
        }

        function initPlayers() {
            if (playersReady) return Promise.resolve();
            return loadWistia().then(() => {
                swiper.slides.forEach((slide) => {
                    const player = createPlayer(slide);
                    if (!player || player.dataset.bound) return;
                    player.dataset.bound = 'true';
                    player.addEventListener('ended', () => {
                        if (slide === swiper.slides[swiper.activeIndex]) swiper.slideNext();
                    });
                });
                playersReady = true;
            });
        }

        // lazy-load players near the viewport, pause when off-screen
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                inView = entry.isIntersecting;
                if (inView) {
                    initPlayers().then(syncPlayback);
                } else {
                    clearTimeout(fallbackTimer);
                    swiper.slides.forEach((s) => {
                        try { s.querySelector('wistia-player')?.pause(); } catch (e) {}
                    });
                }
            });
        }, { rootMargin: '200px 0px', threshold: 0.25 });
        io.observe(section);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(fallbackTimer);
                swiper.slides.forEach((s) => { try { s.querySelector('wistia-player')?.pause(); } catch (e) {} });
            } else if (inView) {
                syncPlayback();
            }
        });

        applyDepth(swiper);
        updateDots(swiper);
        window.addEventListener('resize', () => swiper.update());
    });

    console.log('running creativeCarousel()');
}
