/* =====================================================
   EV Charging Landing Page - GSAP Animations
   Complete rewrite with all fixes:
   1. Hero: car follows green route path via MotionPathPlugin
   2. Charging Updates: dotted line draws -> car appears -> card fades -> progress fills
   3. On The Go: phone mockup parallax on scroll
   4. All other section scroll-triggered reveals
   ===================================================== */

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

var isMobile = window.matchMedia('(max-width: 767px)').matches;
var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =====================================================
   SAFETY FALLBACK: If GSAP ticker is frozen, force-show
   all elements after 2 seconds.
   ===================================================== */
var _gsapSafetyTimer = null;
var _gsapTickCount = 0;
var _hiddenSelectors = [
  '#hero-map', '.hero-title', '.hero-subtitle', '.hero-buttons',
  '.hero-note', '.hero-stats', '#hero-route-svg', '#hero-car',
  '.hero-marker', '#hero-popup-card', '.hero-glow-start', '.hero-glow-end',
  '.charging-image-area', '.charging-card', '.charging-title', '.charging-feature-card',
  '#charging-dotted-line', '#charging-endpoint',
  '.otg-content', '.otg-mockup',
  '.auto-header', '.feature-card',
  '.cta-content', '.cta-car',
  '.home-header', '.home-card', '.home-image',
  '.testimonial-badge', '.testimonial-header', '.testimonial-carousel',
  '.journey-content'
];

function _forceShowAll() {
  _hiddenSelectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      // Skip car - it has its own inline CSS transform for rotation
      if (el.id === 'hero-car') {
        el.style.opacity = '1';
        return;
      }
      gsap.set(el, { clearProps: 'all' });
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  // Fill progress bar
  var bar = document.getElementById('charging-progress-bar');
  if (bar) bar.style.width = '65%';
  // Set counter
  var counter = document.getElementById('charge-counter');
  if (counter) counter.textContent = '1575';
  // Show route path
  var routePath = document.getElementById('car-motion-path');
  if (routePath) routePath.style.strokeDashoffset = '0';
  // Set car visible at end of path in fallback
  var heroCar = document.getElementById('hero-car');
  if (heroCar) {
    heroCar.style.opacity = '1';
    // Place at end of path with correct rotation (only when GSAP failed, so no tween is running)
    var path = document.getElementById('car-motion-path');
    if (path && typeof path.getPointAtLength === 'function') {
      var len = path.getTotalLength();
      var pt = path.getPointAtLength(len);
      var ptPrev = path.getPointAtLength(len - 2);
      var angle = Math.atan2(pt.y - ptPrev.y, pt.x - ptPrev.x) * (180 / Math.PI) - 90;
      var svg = document.getElementById('hero-route-svg');
      if (svg) {
        var svgRect = svg.getBoundingClientRect();
        var scaleX = svgRect.width / 405;
        var scaleY = svgRect.height / 473;
        heroCar.style.left = (pt.x * scaleX - 23) + 'px';
        heroCar.style.top = (pt.y * scaleY - 43) + 'px';
        heroCar.style.transform = 'rotate(' + angle + 'deg)';
      }
    }
  }
}

function _startSafetyTimer() {
  _gsapSafetyTimer = setTimeout(function () {
    if (_gsapTickCount < 10) {
      _forceShowAll();
    }
  }, 2000);
}

gsap.ticker.add(function () {
  _gsapTickCount++;
  if (_gsapTickCount >= 10 && _gsapSafetyTimer) {
    clearTimeout(_gsapSafetyTimer);
    _gsapSafetyTimer = null;
  }
});

/* =====================================================
   NAVIGATION
   ===================================================== */
function initNavigation() {
  var navbar = document.getElementById('navbar');
  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileMenuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('hidden');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

/* =====================================================
   HERO SECTION ANIMATIONS
   - Map fades in
   - Text content animates in
   - Green route path draws
   - Car follows the path using MotionPathPlugin
   - Waypoints appear along the route
   - Station popup card appears at destination
   ===================================================== */
function initHeroAnimations() {
  // Initial hidden states
  gsap.set('#hero-map', { opacity: 0 });
  gsap.set(['.hero-title', '.hero-subtitle', '.hero-buttons', '.hero-note', '.hero-stats'], { opacity: 0, y: 30 });
  gsap.set('#hero-route-svg', { opacity: 0 });
  gsap.set('#hero-car', { opacity: 0 });
  gsap.set('.hero-marker', { opacity: 0, scale: 0.5 });
  gsap.set('#hero-popup-card', { opacity: 0, y: 20 });
  gsap.set('.hero-glow-start', { opacity: 0 });
  gsap.set('.hero-glow-end', { opacity: 0 });
  gsap.set('.hero-waypoint', { opacity: 0, scale: 0.5 });

  // Main timeline (start early; path + car visible and moving soon)
  var tl = gsap.timeline({ delay: 0.3 });

  // 1. Map loads
  tl.to('#hero-map', { opacity: 1, duration: 1.2, ease: 'power2.out' })
    // 2. Text content fades in
    .to('.hero-title', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.6')
    .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
    .to('.hero-buttons', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.3')
    .to('.hero-note', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.25')
    .to('.hero-stats', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.3');

  // Desktop-only: show path + car soon, then start car animation
  if (!isMobile) {
    var routePath = document.getElementById('car-motion-path');
    var pathLength = routePath ? routePath.getTotalLength() : 2000;

    if (routePath) {
      routePath.style.strokeDasharray = pathLength;
      routePath.style.strokeDashoffset = pathLength;
    }

    // Path is closed (Z): progress 1 = back at start. Find progress where path is at destination (396, 93) so car stops there.
    var motionEnd = 1;
    if (routePath && typeof routePath.getPointAtLength === 'function') {
      var totalLen = routePath.getTotalLength();
      var destX = 396;
      var destY = 93;
      var bestProgress = 0;
      var bestDist = 1e9;
      for (var step = 0; step <= 300; step++) {
        var progress = step / 300;
        var len = progress * totalLen;
        var pt = routePath.getPointAtLength(len);
        var d = (pt.x - destX) * (pt.x - destX) + (pt.y - destY) * (pt.y - destY);
        if (d < bestDist) {
          bestDist = d;
          bestProgress = progress;
        }
      }
      motionEnd = bestProgress;
    }

    // 3. Show SVG path and car together quickly, then draw path and start car
    tl.to('#hero-route-svg', { opacity: 1, duration: 0.2 }, '-=0.5')
      .to('.hero-glow-start', { opacity: 0.8, duration: 0.35, ease: 'power2.out' })
      .to('#hero-car', { opacity: 1, duration: 0.2 }, '-=0.35')

      // 4. Green route path draws (faster so car can start sooner)
      .to(routePath, {
        strokeDashoffset: 0,
        duration: 2.2,
        ease: 'power1.inOut'
      }, '-=0.2')

      // 5. Waypoint markers along the route
      .to('.hero-waypoint', {
        opacity: 1,
        scale: 1,
        stagger: 0.2,
        duration: 0.35,
        ease: 'back.out(1.5)'
      }, '-=1.6')

      // 6. Car drives along the path; stops at destination (motionEnd), never returns to start
      .to('#hero-car', {
        duration: 7,
        ease: 'power1.inOut',
        repeat: 0,
        yoyo: false,
        motionPath: {
          path: '#car-motion-path',
          align: '#car-motion-path',
          alignOrigin: [0.5, 0.5],
          autoRotate: -90,
          start: 0,
          end: motionEnd
        }
      }, '-=1.8')

      // 7. Glow at destination
      .to('.hero-glow-end', { opacity: 0.8, duration: 0.5, ease: 'power2.out' }, '-=0.5')

      // 8. Location markers pop in
      .to('.hero-marker', {
        opacity: 1,
        scale: 1,
        stagger: 0.15,
        duration: 0.4,
        ease: 'back.out(1.5)'
      }, '-=0.8')

      // 9. Station popup card appears at destination
      .to('#hero-popup-card', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.5,
        ease: 'power2.out'
      }, '-=0.3');
  }
}

/* =====================================================
   CHARGING UPDATES SECTION
   Animation sequence:
   1. Background image area fades in
   2. Dotted line draws first
   3. Green dot appears at end of dotted line
   4. Charging details card fades in
   5. Progress bar fills from 0 -> 100%
   6. Right side title + feature cards animate in

   Smooth scroll refinement: cubic-bezier easing for
   natural deceleration, slightly longer durations
   ===================================================== */
function initChargingUpdates() {
  // Initial hidden states
  gsap.set('.charging-image-area', { opacity: 0, x: -30 });
  gsap.set('.charging-card', { opacity: 0, y: 30 });
  gsap.set('.charging-title', { opacity: 0, x: 30 });
  gsap.set('.charging-feature-card', { opacity: 0, y: 30 });
  gsap.set('#charging-endpoint', { opacity: 0, scale: 0 });

  // Dotted line initial state
  var dottedLine = document.querySelector('#charging-dotted-line line');
  if (dottedLine) {
    dottedLine.style.strokeDashoffset = '140';
  }

  ScrollTrigger.create({
    trigger: '#charging-updates',
    start: 'top 85%',  /* Smooth scroll: trigger slightly earlier for less abrupt entry */
    once: true,
    onEnter: function () {
      var tl = gsap.timeline();

      // 1. Background image area fades in — smooth cubic-bezier for natural deceleration
      tl.to('.charging-image-area', { opacity: 1, x: 0, duration: 1.4, ease: 'power3.out' })

        // 2. Charging details card fades in early — overlaps with image for faster perceived load
        .to('.charging-card', {
          opacity: 1,
          y: 0,
          duration: 1.3,
          ease: 'power3.out',
          onComplete: function () {
            // 3. Progress bar fills smoothly after card is visible
            gsap.to('#charging-progress-bar', {
              width: '65%',
              duration: 2.8,
              ease: 'power2.out'
            });
            // Counter animates
            animateCounter('#charge-counter', 0, 1575, 2800);
          }
        }, '-=1.0')  /* Start while image is still fading in */

        // 4. Dotted line draws from top to bottom
        .to(dottedLine, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.inOut'
        }, '-=0.8')

        // 5. Green dot appears at end of dotted line
        .to('#charging-endpoint', {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: 'back.out(1.7)'
        }, '-=0.3');

      // Right side content (parallel with left) — staggered with smooth easing
      gsap.to('.charging-title', { opacity: 1, x: 0, duration: 1.4, delay: 0.5, ease: 'power3.out' });
      gsap.to('.charging-feature-card', { opacity: 1, y: 0, stagger: 0.25, duration: 1.1, delay: 1, ease: 'power3.out' });
    }
  });
}

/* =====================================================
   ON-THE-GO CHARGING SECTION
   - Content slides in from left
   - Phone mockup slides in from bottom
   - Parallax: phone moves upward on scroll (translateY: 80px -> 0)

   Smooth scroll refinement: scrub increased for smoother
   parallax, power3.out for elegant deceleration
   ===================================================== */
function initOnTheGo() {
  gsap.set('.otg-content', { opacity: 0, x: -30 });
  gsap.set('.otg-mockup', { opacity: 0, y: 80 });

  ScrollTrigger.create({
    trigger: '#on-the-go',
    start: 'top 85%',  /* Smooth scroll: trigger slightly earlier */
    once: true,
    onEnter: function () {
      gsap.to('.otg-content', { opacity: 1, x: 0, duration: 1.4, ease: 'power3.out' });
      gsap.to('.otg-mockup', { opacity: 1, y: 0, duration: 1.5, delay: 0.4, ease: 'power3.out' });
    }
  });

  // Parallax: phone mockup moves upward as user scrolls
  if (!isMobile) {
    gsap.fromTo('.otg-mockup', {
      y: 80
    }, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '#on-the-go',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5  /* Smooth scroll: higher scrub for smoother, less jumpy parallax */
      }
    });
  }
}

/* =====================================================
   AUTOMATED CHARGING SECTION
   Smooth scroll refinement: power3.out easing, longer
   stagger for cascading reveal feel
   ===================================================== */
function initAutomatedCharging() {
  gsap.set('.auto-header', { opacity: 0, y: 30 });
  gsap.set('.feature-card', { opacity: 0, y: 40 });

  ScrollTrigger.create({
    trigger: '#features',
    start: 'top 85%',  /* Smooth scroll: trigger earlier */
    once: true,
    onEnter: function () {
      gsap.to('.auto-header', { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' });
      gsap.to('.feature-card', { opacity: 1, y: 0, stagger: 0.3, duration: 1.2, delay: 0.4, ease: 'power3.out' });
    }
  });
}

/* =====================================================
   CTA SECTION
   Smooth scroll refinement: power3.out for elegant entry
   ===================================================== */
function initCTA() {
  gsap.set('.cta-content', { opacity: 0, x: -30 });
  gsap.set('.cta-car', { opacity: 0, x: 120 });  /* Start further right for a longer, smoother glide */

  ScrollTrigger.create({
    trigger: '#cta',
    start: 'top 85%',
    once: true,
    onEnter: function () {
      gsap.to('.cta-content', { opacity: 1, x: 0, duration: 1.4, ease: 'power3.out' });
      gsap.to('.cta-car', { opacity: 1, x: 0, duration: 2.8, delay: 0.3, ease: 'power2.out' });  /* Slower, smoother car glide */
    }
  });
}

/* =====================================================
   FULL CONTROL FROM HOME SECTION
   Smooth scroll refinement: cascading card reveal with
   longer stagger, power3.out easing
   ===================================================== */
function initFullControl() {
  gsap.set('.home-header', { opacity: 0, y: 30 });
  gsap.set('.home-card', { opacity: 0, y: 30 });
  gsap.set('.home-image', { opacity: 0, x: 40 });

  ScrollTrigger.create({
    trigger: '#full-control',
    start: 'top 85%',  /* Smooth scroll: trigger earlier */
    once: true,
    onEnter: function () {
      gsap.to('.home-header', { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' });
      gsap.to('.home-card', { opacity: 1, y: 0, stagger: 0.25, duration: 1.1, delay: 0.4, ease: 'power3.out' });
      gsap.to('.home-image', { opacity: 1, x: 0, duration: 1.4, delay: 0.5, ease: 'power3.out' });
    }
  });
}

/* =====================================================
   TESTIMONIALS CAROUSEL
   ===================================================== */
function initTestimonials() {
  var track = document.getElementById('testimonial-track');
  var prevBtn = document.getElementById('testimonial-prev');
  var nextBtn = document.getElementById('testimonial-next');
  var cards = document.querySelectorAll('.testimonial-card');

  if (!track || cards.length === 0) return;

  var currentIndex = 0;
  var autoPlayInterval;
  var cardWidth = cards[0].offsetWidth + 20;
  var maxIndex = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));

  function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    gsap.to(track, { x: -currentIndex * cardWidth, duration: 0.7, ease: 'power3.out' });  /* Smooth scroll: smoother carousel slide */
  }

  function nextSlide() { goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1); }
  function prevSlide() { goToSlide(currentIndex <= 0 ? maxIndex : currentIndex - 1); }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  // Mobile testimonial nav buttons
  var mobilePrev = document.querySelector('.testimonial-mobile-prev');
  var mobileNext = document.querySelector('.testimonial-mobile-next');
  if (mobilePrev) mobilePrev.addEventListener('click', prevSlide);
  if (mobileNext) mobileNext.addEventListener('click', nextSlide);

  function startAutoPlay() { autoPlayInterval = setInterval(nextSlide, 4500); }
  function stopAutoPlay() { clearInterval(autoPlayInterval); }

  startAutoPlay();
  track.addEventListener('mouseenter', stopAutoPlay);
  track.addEventListener('mouseleave', startAutoPlay);

  // Reveal animation — smooth scroll: power3.out for elegant entry
  gsap.set(['.testimonial-badge', '.testimonial-header', '.testimonial-carousel'], { opacity: 0, y: 20 });

  ScrollTrigger.create({
    trigger: '#testimonials',
    start: 'top 85%',  /* Smooth scroll: trigger earlier */
    once: true,
    onEnter: function () {
      gsap.to('.testimonial-badge', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });
      gsap.to('.testimonial-header', { opacity: 1, y: 0, duration: 1.3, delay: 0.25, ease: 'power3.out' });
      gsap.to('.testimonial-carousel', { opacity: 1, y: 0, duration: 1.4, delay: 0.5, ease: 'power3.out' });
    }
  });
}

/* =====================================================
   JOURNEY PLANNER SECTION
   ===================================================== */
function initJourneyPlanner() {
  gsap.set('.journey-content', { opacity: 0, y: 30 });

  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top 85%',  /* Smooth scroll: trigger earlier */
    once: true,
    onEnter: function () {
      gsap.to('.journey-content', { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' });
    }
  });
}

/* =====================================================
   COUNTER UTILITY
   ===================================================== */
function animateCounter(selector, from, to, duration) {
  var el = document.querySelector(selector);
  if (!el) return;
  var obj = { value: from };
  gsap.to(obj, {
    value: to,
    duration: duration / 1000,
    ease: 'power1.out',
    onUpdate: function () { el.textContent = Math.round(obj.value); }
  });
}

/* =====================================================
   INITIALIZE ALL ANIMATIONS
   ===================================================== */
(function () {
  // Add gsap-pending class for CSS fallback animation
  document.body.classList.add('gsap-pending');

  if (prefersReducedMotion) {
    document.body.classList.remove('gsap-pending');
    initNavigation();
    initTestimonials();
    return;
  }

  initNavigation();
  initHeroAnimations();
  initChargingUpdates();
  initOnTheGo();
  initAutomatedCharging();
  initCTA();
  initFullControl();
  initTestimonials();
  initJourneyPlanner();

  // Start JS safety fallback timer
  _startSafetyTimer();

  // Remove gsap-pending once GSAP confirms it's running
  gsap.ticker.add(function checkTicker() {
    if (_gsapTickCount >= 10) {
      document.body.classList.remove('gsap-pending');
      gsap.ticker.remove(checkTicker);
    }
  });
})();

window.addEventListener('resize', function () { ScrollTrigger.refresh(); });
