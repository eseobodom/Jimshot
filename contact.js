function showToast(message, icon = "✨") {
  const toast = document.getElementById("notificationToast");
  const msgSpan = document.getElementById("toastMessage");
  const iconSpan = toast.querySelector(".notification-icon");
  iconSpan.innerText = icon;
  msgSpan.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

const form = document.getElementById("contactForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector(".submit-btn");
  const originalText = submitBtn.innerText;
  submitBtn.innerText = "Sending...";
  submitBtn.disabled = true;
  
  try {
    const formData = new FormData(form);
    
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      showToast("Message sent successfully! We'll get back to you soon.", "📨");
      form.reset();
    } else {
      const data = await response.json();
      if (data.errors) {
        showToast(data.errors.map(error => error.message).join(", "), "❌");
      } else {
        showToast("Something went wrong. Please try again.", "❌");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Network error. Please check your connection.", "❌");
  } finally {
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
  }
});

const menu = document.getElementById("menu");
const icon = document.getElementById("menuIcon");
const overlayEl = document.getElementById("overlay");

function toggleMenu() {
  menu.classList.toggle("active");
  icon.classList.toggle("active");
  overlayEl.classList.toggle("active");
}

icon.addEventListener("click", toggleMenu);
overlayEl.addEventListener("click", toggleMenu);
document.querySelectorAll(".menu a").forEach(link => {
  link.addEventListener("click", toggleMenu);
});

const faders = document.querySelectorAll(".fade");
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});
faders.forEach(el => fadeObserver.observe(el));

const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];
function initParticles() {
  particles = [];
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      d: Math.random() * 1.5 + 0.5
    });
  }
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 215, 0, 0.7)";
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  particles.forEach(p => {
    p.y += p.d;
    if (p.y > canvas.height) {
      p.y = 0;
      p.x = Math.random() * canvas.width;
    }
  });
}
setInterval(drawParticles, 35);
window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});