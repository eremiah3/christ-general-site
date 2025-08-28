// ==================== MAIN SCRIPT ====================
document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ==================== FOOTER YEAR ====================
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ==================== NAVIGATION ====================
  const menuBtn = $('#menuBtn');  
  const navList = $('#navList');
  const navbar = $('.navbar');

 if (menuBtn && navList) {
  menuBtn.addEventListener('click', () => {
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!expanded));
    navList.classList.toggle('show');

    // toggle animation class
    menuBtn.classList.toggle('open');
  });
}


  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // ==================== HERO PARALLAX ====================
  const heroLayer = $('#heroLayer');
  if (heroLayer) {
    window.addEventListener('scroll', () => {
      heroLayer.style.transform = `translateY(${window.scrollY * 0.2}px)`;
    }, { passive: true });
  }

  // ==================== SCROLL REVEAL ====================
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$('[data-reveal], .card, .gallery-item, .testimony').forEach(el => io.observe(el));

  // ==================== IMAGE FALLBACK ====================
  $$('img').forEach(img => {
    img.addEventListener('error', () => {
      console.warn('[Image Error]', img.src);
      img.src = "data:image/svg+xml;charset=UTF-8," + 
        encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
          <rect width='100%' height='100%' fill='#1a2536'/>
          <text x='50%' y='50%' dy='.35em' text-anchor='middle'
                font-family='Arial' font-size='16' fill='#9fb0c0'>
            image unavailable
          </text>
        </svg>`);
    });
  });

  // ==================== SERMON MODAL ====================
  const sermonModal = $('#sermonModal');
  const sermonVideo = $('#sermonVideo');
  const playBtns = $$('.play-btn');

  const getYouTubeEmbedUrl = url => {
    try {
      let videoId = null;
      if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split(/[?&]/)[0];
      else if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1].split("&")[0];
      else if (url.includes("/live/")) videoId = url.split("/live/")[1].split(/[?&]/)[0];
      else if (url.includes("/embed/")) return url;
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      return url;
    } catch { return url; }
  };

  playBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!sermonModal || !sermonVideo) return;
      const rawUrl = btn.getAttribute('data-video');
      if (!rawUrl) return;
      const embedUrl = getYouTubeEmbedUrl(rawUrl);
      sermonVideo.src = `${embedUrl}?autoplay=1&rel=0&modestbranding=1`;
      sermonModal.classList.add('show');
      sermonModal.setAttribute('aria-hidden', 'false');
    });
  });

  if (sermonModal) {
    sermonModal.addEventListener('click', e => {
      if (e.target.dataset.close !== undefined || e.target.classList.contains('modal-overlay')) {
        sermonModal.classList.remove('show');
        sermonModal.setAttribute('aria-hidden', 'true');
        if (sermonVideo) sermonVideo.src = '';
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sermonModal.classList.contains('show')) {
        sermonModal.classList.remove('show');
        sermonModal.setAttribute('aria-hidden', 'true');
        if (sermonVideo) sermonVideo.src = '';
      }
    });
  }

// ==================== CONTACT FORM ====================
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const sendBtn = document.getElementById('sendBtn');

if (contactForm && formStatus && sendBtn) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      subject: contactForm.subject.value.trim(),
      message: contactForm.message.value.trim()
    };

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      formStatus.textContent = "⚠️ Please fill in all fields.";
      formStatus.style.color = "red";
      return;
    }

    sendBtn.disabled = true;
    formStatus.textContent = "⏳ Sending...";
    formStatus.style.color = "black";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        formStatus.textContent = "✅ Message sent! Thank you.";
        formStatus.style.color = "green";
        contactForm.reset();
      } else {
        const msg = result.error || (result.errors ? result.errors.join(", ") : "Unknown error");
        formStatus.textContent = "❌ Failed: " + msg;
        formStatus.style.color = "red";
      }
    } catch (err) {
      console.error("Frontend fetch error:", err);
      formStatus.textContent = "❌ Failed: " + err.message;
      formStatus.style.color = "red";
    } finally {
      sendBtn.disabled = false;
    }
  });
}
});
