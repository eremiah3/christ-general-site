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
       else if (url.includes("shorts")) videoId = url.split("shorts")[1].split("&")[0];
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

// ==================== DAILY DEVOTIONS ====================
const verses = [
  { text: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.", reference: "Jeremiah 29:11" },
  { text: "I can do all things through him who strengthens me.", reference: "Philippians 4:13" },
  { text: "Trust in the LORD with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
  { text: "The LORD is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.", reference: "Joshua 1:9" },
  { text: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.", reference: "Isaiah 40:31" },
  { text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", reference: "Romans 8:28" },
  { text: "Your word is a lamp to my feet and a light to my path.", reference: "Psalm 119:105" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
  { text: "Rejoice in hope, be patient in tribulation, be constant in prayer.", reference: "Romans 12:12" },
  { text: "The LORD is near to the brokenhearted and saves the crushed in spirit.", reference: "Psalm 34:18" },
  { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", reference: "John 3:16" },
  { text: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!", reference: "Psalm 46:10" },
  { text: "The steadfast love of the LORD never ceases; his mercies never come to an end.", reference: "Lamentations 3:22" },
  { text: "I have said these things to you, that in me you may have peace. In the world you will have tribulation. But take heart; I have overcome the world.", reference: "John 16:33" },
  { text: "Let the words of my mouth and the meditation of my heart be acceptable in your sight, O LORD, my rock and my redeemer.", reference: "Psalm 19:14" },
  { text: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.", reference: "2 Corinthians 5:17" },
  { text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.", reference: "Galatians 6:9" },
  { text: "Seek first the kingdom of God and his righteousness, and all these things will be added to you.", reference: "Matthew 6:33" }
];

let currentVerseIndex = 0;

function showVerse(index) {
  const verseTextEl = document.getElementById('verseText');
  const verseRefEl = document.getElementById('verseReference');
  if (!verseTextEl || !verseRefEl) return;

  // Typing effect function
  function typeText(element, text, delay = 30) {
    element.textContent = '';
    let i = 0;
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, delay);
      }
    }
    type();
  }

  // Add fade-out class
  verseTextEl.classList.add('fade-out');
  verseRefEl.classList.add('fade-out');

  setTimeout(() => {
    const verse = verses[index];
    // Use typing effect for verse text and reference
    typeText(verseTextEl, verse.text);
    typeText(verseRefEl, `— ${verse.reference}`);

    // Remove fade-out and add fade-in
    verseTextEl.classList.remove('fade-out');
    verseRefEl.classList.remove('fade-out');
    verseTextEl.classList.add('fade-in');
    verseRefEl.classList.add('fade-in');

    // Remove fade-in after animation
    setTimeout(() => {
      verseTextEl.classList.remove('fade-in');
      verseRefEl.classList.remove('fade-in');
    }, 500);
  }, 250);
}

function cycleVerses() {
  showVerse(currentVerseIndex);
  currentVerseIndex = (currentVerseIndex + 1) % verses.length;
}

// Initial display
cycleVerses();

// Change verse every 40 seconds (40000 ms)
setInterval(cycleVerses, 30000);
});
