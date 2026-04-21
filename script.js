/* ═══════════════════════════════
   Dr. Fixit Mobile — Shared JS
   ═══════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Highlight active nav link ──
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === path) a.classList.add('active');
  });

  // ── Mobile hamburger ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('open');
  });

  // Close mobile menu on link click
  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ── Scroll reveal ──
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // ── Chatbot ──
  const chatBtn  = document.getElementById('chatBtn');
  const chatWin  = document.getElementById('chatWin');
  const chatClose = document.getElementById('chatClose');
  const chatMsgs = document.getElementById('chatMsgs');
  const chatInp  = document.getElementById('chatInp');
  const chatSend = document.getElementById('chatSend');
  const qbtns    = document.querySelectorAll('.qbtn');

  if (!chatBtn) return;

  const history = [];

  chatBtn.addEventListener('click', () => {
    chatWin.classList.toggle('open');
    if (chatWin.classList.contains('open')) chatInp.focus();
  });
  chatClose.addEventListener('click', () => chatWin.classList.remove('open'));
  chatInp.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  chatSend.addEventListener('click', sendMsg);

  qbtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chatInp.value = btn.dataset.q;
      sendMsg();
      btn.closest('.qbtns')?.remove();
    });
  });

  function addMsg(text, role) {
    const d = document.createElement('div');
    d.className = `msg ${role === 'assistant' ? 'b' : 'u'}`;
    const icon = role === 'assistant' ? 'robot' : 'user';
    d.innerHTML = `<div class="m-av"><i class="fas fa-${icon}"></i></div><div class="m-bub">${text}</div>`;
    chatMsgs.appendChild(d);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function showTyping() {
    const d = document.createElement('div');
    d.id = 'typing'; d.className = 'msg b';
    d.innerHTML = `<div class="m-av"><i class="fas fa-robot"></i></div><div class="typing"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>`;
    chatMsgs.appendChild(d);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function removeTyping() {
    document.getElementById('typing')?.remove();
  }

  async function sendMsg() {
    const text = chatInp.value.trim();
    if (!text) return;
    chatInp.value = '';
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    showTyping();
    chatSend.disabled = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || "Sorry, I couldn't get a response right now.";
      history.push({ role: 'assistant', content: reply });
      addMsg(reply, 'assistant');
    } catch {
      removeTyping();
      addMsg('Having trouble connecting. Call us at <strong>(647) 760-4786</strong>!', 'assistant');
    } finally {
      chatSend.disabled = false;
      chatInp.focus();
    }
  }


});
