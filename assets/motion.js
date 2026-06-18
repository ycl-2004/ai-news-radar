(function () {
  if (!window.gsap) return;

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", function () {
    gsap.defaults({ duration: 0.55, ease: "power3.out" });

    // Page intro timeline
    const tl = gsap.timeline();
    tl.from(".hero-headline", { autoAlpha: 0, y: 18, duration: 0.5 })
      .from(".hero-sub", { autoAlpha: 0, y: 10, duration: 0.4 }, "-=0.2")
      .from(".hero-meta", { autoAlpha: 0, y: 10, duration: 0.4 }, "-=0.25")
      .from(".stat", { autoAlpha: 0, y: 14, scale: 0.98, stagger: 0.06, duration: 0.45 }, "-=0.15")
      .from(".section-tab", { autoAlpha: 0, y: 10, stagger: 0.045, duration: 0.4 }, "-=0.2")
      .from(".section-summary", { autoAlpha: 0, y: 8, duration: 0.35 }, "-=0.25")
      .from(".primary-controls", { autoAlpha: 0, y: 8, duration: 0.4 }, "-=0.15")
      .from(".advanced-panel", { autoAlpha: 0, y: 8, duration: 0.4 }, "-=0.3");

    // Top stories render after data loads; keep legacy selectors for old data views.
    document.addEventListener("aiRadar:briefRendered", function () {
      const brief = document.querySelector(".bole-picks-wrap");
      const cards = Array.from(document.querySelectorAll(".top-story-card, .story-row, .bole-row")).slice(0, 24);
      if (brief) {
        gsap.fromTo(brief, { y: 12 }, { y: 0, duration: 0.35, clearProps: "transform" });
      }
      if (!cards.length) return;
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: "transform" });
      gsap.from(cards, { autoAlpha: 0, stagger: 0.035, duration: 0.28, clearProps: "opacity,visibility" });
    });

    // List: animate first 30 visible cards on render/mode switch
    document.addEventListener("aiRadar:listRendered", function () {
      const cards = Array.from(document.querySelectorAll(".intel-card, .news-card")).slice(0, 30);
      if (!cards.length) return;
      gsap.from(cards, { autoAlpha: 0, y: 12, stagger: 0.03, duration: 0.4, clearProps: "transform,opacity,visibility" });
    });

    // Section scroll reveal via IntersectionObserver. Keep sections visible:
    // hiding whole content blocks can leave blank viewports after responsive
    // reflow or rapid mobile scrolling.
    const revealEls = document.querySelectorAll(".bole-picks-wrap, .waytoagi-wrap, .list-wrap");
    if (revealEls.length && window.IntersectionObserver) {
      gsap.set(revealEls, { y: 14 });
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            gsap.to(entry.target, { y: 0, duration: 0.45, clearProps: "transform" });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      revealEls.forEach(function (el) { observer.observe(el); });
    }
  });
}());
