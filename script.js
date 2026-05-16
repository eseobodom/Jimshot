const SUPABASE_URL = 'https://lkbpzgvkfjxxagggyeqq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Va5qkboOFppJB60mfU73yw__sEhSeOk';

if (!window._supabaseInitialized) {
  window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window._supabaseInitialized = true;
}
const supabaseClient = window._supabase;

function showToast(message, icon = "✨") {
  const toast = document.getElementById("notificationToast");
  const msgSpan = document.getElementById("toastMessage");
  const iconSpan = toast.querySelector(".notification-icon");
  iconSpan.innerText = icon;
  msgSpan.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function showLoading() {
  document.getElementById("loadingOverlay").classList.add("show");
}
function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("show");
}

function escapeHtml(str) {
  if (!str) return "✨ New Design ✨";
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m] || m));
}

function updateEmptyStateAndCounter() {
  const postsCount = document.querySelectorAll(".card").length;
  const designCountSpan = document.getElementById("designCount");
  const emptyStateDiv = document.getElementById("emptyStateMsg");
  if(designCountSpan) designCountSpan.innerText = `${postsCount} ${postsCount === 1 ? 'piece' : 'pieces'}`;
  if(emptyStateDiv) emptyStateDiv.style.display = postsCount === 0 ? "block" : "none";
}


function createCardFromPost(post, isAdminMode) {
  const div = document.createElement("div");
  div.className = "card fade";
  div.setAttribute("data-id", post.id);
  div.innerHTML = `
    <p contenteditable="false">${escapeHtml(post.caption)}</p>
    <img src="${post.image_url}" alt="design">
  `;
  
  if (isAdminMode) {
    attachAdminButtons(div, post.id, post.image_url);
  }
  
  observeFade(div);
  return div;
}


function attachAdminButtons(cardElement, postId, currentImageUrl) {
  if (!cardElement) return;
  const textParagraph = cardElement.querySelector("p");
  const imgElement = cardElement.querySelector("img");
  
  if (imgElement && !imgElement.classList.contains("editable-img")) {
    imgElement.classList.add("editable-img");
  }
  
  const oldActions = cardElement.querySelector(".action-buttons");
  if (oldActions) oldActions.remove();
  
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "action-buttons";
  const editBtn = document.createElement("button");
  editBtn.innerText = "Edit";
  editBtn.className = "edit-btn";
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "🗑️ Delete";
  deleteBtn.className = "delete-btn";
  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);
  cardElement.appendChild(actionsDiv);
  
  
  editBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    
    if (textParagraph) {
      textParagraph.contentEditable = "true";
      textParagraph.focus();
      textParagraph.style.backgroundColor = "rgba(255,215,0,0.15)";
      textParagraph.style.borderRadius = "8px";
      textParagraph.style.padding = "6px 12px";
      textParagraph.style.outline = "1px solid gold";
      
      const saveCaption = async () => {
        textParagraph.contentEditable = "false";
        textParagraph.style.backgroundColor = "transparent";
        textParagraph.style.padding = "0";
        textParagraph.style.outline = "none";
        
        const newCaption = textParagraph.innerText;
        showLoading();
        const { error } = await supabaseClient
          .from('posts')
          .update({ caption: newCaption })
          .eq('id', postId);
        hideLoading();
        if (error) {
          showToast("Failed to update caption", "❌");
        } else {
          showToast("Caption updated!", "✏️");
        }
        textParagraph.removeEventListener("blur", saveCaption);
      };
      textParagraph.addEventListener("blur", saveCaption, { once: true });
    }
    
    
    const hiddenFileInput = document.createElement("input");
    hiddenFileInput.type = "file";
    hiddenFileInput.accept = "image/*";
    hiddenFileInput.style.display = "none";
    document.body.appendChild(hiddenFileInput);
    
    hiddenFileInput.addEventListener("change", async (fileEvent) => {
      const newFile = hiddenFileInput.files[0];
      if (newFile && imgElement) {
        showLoading();
        try {
          const fileName = `${Date.now()}_${newFile.name}`;
          const { error: uploadError } = await supabaseClient.storage
            .from('designs')
            .upload(fileName, newFile);
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabaseClient.storage
            .from('designs')
            .getPublicUrl(fileName);
          
          const newImageUrl = urlData.publicUrl;
          
          const { error: updateError } = await supabaseClient
            .from('posts')
            .update({ image_url: newImageUrl })
            .eq('id', postId);
          
          if (updateError) throw updateError;
          
          imgElement.src = newImageUrl;
          showToast("Image updated!", "🖼️");
        } catch (err) {
          console.error(err);
          showToast("Image update failed", "❌");
        }
        hideLoading();
      }
      hiddenFileInput.remove();
    });
    
    hiddenFileInput.click();
  });
  
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showDeleteModal(postId, cardElement);
  });
}


let pendingDeleteId = null;
let pendingDeleteCard = null;

function showDeleteModal(postId, cardElement) {
  pendingDeleteId = postId;
  pendingDeleteCard = cardElement;
  document.getElementById("deleteModal").classList.add("show");
}

document.getElementById("confirmDeleteBtn").onclick = async () => {
  if (pendingDeleteId) {
    showLoading();
    const { error } = await supabaseClient
      .from('posts')
      .delete()
      .eq('id', pendingDeleteId);
    hideLoading();
    
    if (error) {
      showToast("Delete failed", "❌");
    } else {
      if (pendingDeleteCard) pendingDeleteCard.remove();
      showToast("Design deleted successfully", "🗑️");
      updateEmptyStateAndCounter();
    }
  }
  document.getElementById("deleteModal").classList.remove("show");
  pendingDeleteId = null;
  pendingDeleteCard = null;
};

document.getElementById("cancelDeleteBtn").onclick = () => {
  document.getElementById("deleteModal").classList.remove("show");
  pendingDeleteId = null;
  pendingDeleteCard = null;
};

async function loadPosts() {
  showLoading();
  const { data: posts, error } = await supabaseClient
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  hideLoading();
  
  if (error) {
    console.error("Error loading posts:", error);
    showToast("Failed to load designs", "❌");
    return;
  }
  
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";
  
  for (const post of posts) {
    const card = createCardFromPost(post, isAdmin);
    postsContainer.appendChild(card);
  }
  
  updateEmptyStateAndCounter();
}

async function uploadNewImage(file, caption) {
  showLoading();
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseClient.storage
      .from('designs')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabaseClient.storage
      .from('designs')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;
    
    const { data: postData, error: dbError } = await supabaseClient
      .from('posts')
      .insert([{ image_url: imageUrl, caption: caption }])
      .select();
    
    if (dbError) throw dbError;
    
    if (postData && postData[0]) {
      const newCard = createCardFromPost(postData[0], isAdmin);
      const postsContainer = document.getElementById("posts");
      postsContainer.prepend(newCard);
      showToast("Design uploaded successfully!", "📸");
      updateEmptyStateAndCounter();
    }
  } catch (err) {
    console.error(err);
    showToast("Upload failed", "❌");
  }
  hideLoading();
}


const intro = document.getElementById("intro");
const mainContent = document.getElementById("mainContent");
const infoSection = document.getElementById("infoSection");
const continueBtn = document.querySelector(".continue-btn");

if (continueBtn) {
  continueBtn.addEventListener("click", () => {
    intro.classList.add("hide");
    setTimeout(() => {
      intro.style.display = "none";
      mainContent.classList.add("show");
      if (infoSection) infoSection.classList.add("show");
      loadPosts();
    }, 700);
  });
}


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
document.querySelectorAll(".menu a").forEach(link => link.addEventListener("click", toggleMenu));


let isAdmin = false;
let tapLocked = false;
const logo = document.querySelector(".logo");
const uploadBox = document.getElementById("uploadBox");
const fileInput = document.getElementById("file");

const modalPin = document.getElementById("customModal");
const pinInputEl = document.getElementById("pinInput");
const modalTitleEl = document.getElementById("modalTitle");
const confirmBtnPin = document.getElementById("confirmBtn");
const cancelBtnPin = document.getElementById("cancelBtn");

if (localStorage.getItem("aurumAdmin") === "true") {
  enableAdminMode(false);
}

function enableAdminMode(showMsg = true) {
  isAdmin = true;
  localStorage.setItem("aurumAdmin", "true");
  uploadBox.classList.add("show");
  document.querySelectorAll(".card").forEach(card => {
    const postId = card.getAttribute("data-id");
    const imgSrc = card.querySelector("img")?.src;
    if (postId && !card.querySelector(".action-buttons")) {
      attachAdminButtons(card, postId, imgSrc);
    }
  });
}

function disableAdminMode() {
  isAdmin = false;
  localStorage.removeItem("aurumAdmin");
  uploadBox.classList.remove("show");
  document.querySelectorAll(".card .action-buttons").forEach(btn => btn.remove());
  document.querySelectorAll(".card img").forEach(img => img.classList.remove("editable-img"));
}

function handleAdminToggle() {
  isAdmin ? showLogoutModal() : showLoginModal();
}

function showLoginModal() {
  modalPin.classList.add("show");
  modalTitleEl.innerText = "Admin Access";
  pinInputEl.style.display = "block";
  pinInputEl.value = "";
  pinInputEl.placeholder = "Enter PIN";
  confirmBtnPin.onclick = () => {
    if (pinInputEl.value === "4444") {
      enableAdminMode(true);
      closePinModal();
      showToast("Admin mode activated! ✨", "🔓");
      tapLocked = true;
      setTimeout(() => { tapLocked = false; }, 1000);
    } else {
      pinInputEl.value = "";
      pinInputEl.placeholder = "❌ Incorrect PIN";
      showToast("Incorrect PIN. Try again.", "❌");
    }
  };
}

function showLogoutModal() {
  modalPin.classList.add("show");
  modalTitleEl.innerText = "Exit Admin Mode?";
  pinInputEl.style.display = "none";
  confirmBtnPin.onclick = () => {
    disableAdminMode();
    closePinModal();
    showToast("Admin mode exited", "🔒");
  };
}
cancelBtnPin.onclick = closePinModal;
function closePinModal() { modalPin.classList.remove("show"); }

logo.addEventListener("dblclick", () => { if (!tapLocked) handleAdminToggle(); });
let lastTapTime = 0;
logo.addEventListener("touchend", (e) => {
  e.preventDefault();
  const now = Date.now();
  if (now - lastTapTime < 300 && now - lastTapTime > 0) {
    if (!tapLocked) handleAdminToggle();
  }
  lastTapTime = now;
});


fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  await uploadNewImage(file, "✨ New Design ✨");
  fileInput.value = "";
});

const faders = document.querySelectorAll(".fade");
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
});
faders.forEach(el => fadeObserver.observe(el));
function observeFade(el) { fadeObserver.observe(el); }


const canvas = document.getElementById("bg");
const ctxBg = canvas.getContext("2d");
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
  ctxBg.clearRect(0, 0, canvas.width, canvas.height);
  ctxBg.fillStyle = "rgba(255, 215, 0, 0.7)";
  particles.forEach(p => {
    ctxBg.beginPath();
    ctxBg.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctxBg.fill();
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
window.addEventListener("resize", () => { resizeCanvas(); initParticles(); });

window.onload = () => {
  document.getElementById("loader").style.display = "none";
};