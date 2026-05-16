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

// FADE ANIMATION ON SCROLL
const faders = document.querySelectorAll(".fade");
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});
faders.forEach(el => fadeObserver.observe(el));

// PARTICLES BACKGROUND
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