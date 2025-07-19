// All JS for markdown rendering, screenshots, and capsules goes here 

// Render About section from game.md with divider support
fetch('game.md')
  .then(res => res.text())
  .then(md => {
    const html = md.replace(/\[divider:([^\]]+)\]/g, (m, filename) => `<img src="about/${filename}" class="about-divider">`)
      .replace(/\n/g, '<br>');
    document.getElementById('about-section').innerHTML = html;
  });

// Dynamically load screenshots (1.png, 2.png, ...)
(function loadScreenshots() {
  const main = document.getElementById('main-screenshot');
  const thumbs = document.getElementById('screenshot-thumbnails');
  let foundMain = false;
  for (let i = 1; i <= 10; i++) {
    const img = document.createElement('img');
    img.src = `screenshots/${i}.png`;
    img.alt = `Screenshot ${i}`;
    img.className = 'screenshot-thumb';
    img.onerror = function() { this.remove(); };
    img.onload = function() {
      if (!foundMain) {
        // First found screenshot is main
        const mainImg = this.cloneNode();
        mainImg.className = '';
        mainImg.style.width = '100%';
        mainImg.style.height = '100%';
        main.appendChild(mainImg);
        foundMain = true;
      }
      thumbs.appendChild(this);
    };
  }
})();

// Dynamically load capsules
(function loadCapsules() {
  const capsuleSection = document.getElementById('capsule-section');
  const capsuleTypes = [
    { name: 'header_capsule.png', class: 'header-capsule', label: 'Header Capsule' },
    { name: 'main_capsule.png', class: 'main-capsule', label: 'Main Capsule' },
    { name: 'small_capsule.png', class: 'small-capsule', label: 'Small Capsule' },
    { name: 'vertical_capsule.png', class: 'vertical-capsule', label: 'Vertical Capsule' }
  ];
  capsuleTypes.forEach(type => {
    const img = document.createElement('img');
    img.src = `capsules/${type.name}`;
    img.alt = type.label;
    img.className = type.class;
    img.onerror = function() { this.remove(); };
    img.onload = function() {
      const div = document.createElement('div');
      div.className = 'capsule-item';
      div.innerHTML = `<div class='capsule-title'>${type.label}</div>`;
      div.appendChild(this);
      capsuleSection.appendChild(div);
    };
  });
})(); 