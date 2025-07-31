// === Confetti Setup (Canvas Based) ===
const confettiCanvas = document.createElement('canvas');
confettiCanvas.id = 'confetti-canvas';
confettiCanvas.style.position = 'fixed';
confettiCanvas.style.top = '0';
confettiCanvas.style.left = '0';
confettiCanvas.style.width = '100vw';
confettiCanvas.style.height = '100vh';
confettiCanvas.style.pointerEvents = 'none';
confettiCanvas.style.zIndex = '1000';
document.body.appendChild(confettiCanvas);

const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

const confettiParticles = [];

function createConfettiParticle() {
  return {
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - 100,
    r: Math.random() * 6 + 4,
    d: Math.random() * 30 + 10,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    tilt: Math.random() * 10 - 10,
    tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    tiltAngle: 0
  };
}

function startConfettiBurst(count = 150) {
  for (let i = 0; i < count; i++) {
    confettiParticles.push(createConfettiParticle());
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach((p, i) => {
    p.tiltAngle += p.tiltAngleIncrement;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.x += Math.sin(p.tiltAngle);
    p.tilt = Math.sin(p.tiltAngle) * 15;

    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
    ctx.stroke();

    if (p.y > confettiCanvas.height) {
      confettiParticles.splice(i, 1);
    }
  });

  requestAnimationFrame(drawConfetti);
}

drawConfetti(); // Start animation loop

// === Allocation Logic (750M Total Pool) ===
const levelData = {
  10: { label: "Top 100",        minXP: 1155, maxXP: 1500, users: 100,    pool: 37500000 },
  9:  { label: "Sr. Lt & Up",    minXP: 955,  maxXP: 1154, users: 440,    pool: 67500000 },
  8:  { label: "Lieutenant",     minXP: 780,  maxXP: 954,  users: 3090,   pool: 127500000 },
  7:  { label: "Junior Lt",      minXP: 630,  maxXP: 779,  users: 9570,   pool: 150000000 },
  6:  { label: "Starshina",      minXP: 455,  maxXP: 629,  users: 45120,  pool: 247500000 },
  5:  { label: "Sr. Sgt",        minXP: 300,  maxXP: 454,  users: 23250,  pool: 75000000 },
  4:  { label: "Sgt",            minXP: 150,  maxXP: 299,  users: 27270,  pool: 45000000 }
};

const multipliers = {
  ideal:     [0.05, 0.075],
  bull:      [0.075, 0.1],
  superbull: [0.12, 0.17],
  gigabull:  [0.17, 0.2]
};

// === UI References ===
const startBox = document.getElementById('start-box');
const formBox = document.getElementById('form-box');
const resultBox = document.getElementById('result-box');
const formError = document.getElementById('form-error');

// === Navigation ===
document.getElementById('start-btn').onclick = () => {
  startBox.classList.add('hidden');
  formBox.classList.remove('hidden');
  formError.innerText = '';
  document.getElementById('username').value = '';
  document.getElementById('tester-level').value = '';
  document.getElementById('tester-xp').value = '';
};

document.getElementById('calc-btn').onclick = () => {
  let username = document.getElementById('username').value.trim();
  let level = parseInt(document.getElementById('tester-level').value, 10);
  let xp = parseInt(document.getElementById('tester-xp').value, 10);
  if (username.startsWith('@')) username = username.slice(1);

  if (isNaN(level) || isNaN(xp) || !username || level < 1 || level > 10) {
    formError.innerText = "Enter Valid Details";
    return;
  }

  if (level < 4) {
    showResult({ username, pfp: '', allocation: 0 });
    startConfettiBurst();
    formBox.classList.add('hidden');
    resultBox.classList.remove('hidden');
    return;
  }

  const d = levelData[level];
  if (!d) {
    formError.innerText = "Enter Valid Details";
    return;
  }

  if ((level === 10 && xp < 1155) || (level !== 10 && (xp < d.minXP || xp > d.maxXP))) {
    formError.innerText = "Enter Valid Details";
    return;
  }

  // Calculate allocation
  let allocation = 0;
  if (level === 10) {
    allocation = 375000;
  } else {
    const meanToken = d.pool / d.users;
    const xpScore = (xp - d.minXP) / (d.maxXP - d.minXP);
    allocation = Math.round(meanToken * (1 + xpScore));
  }

  const cases = {
    ideal: [allocation * multipliers.ideal[0], allocation * multipliers.ideal[1]],
    bull: [allocation * multipliers.bull[0], allocation * multipliers.bull[1]],
    superbull: [allocation * multipliers.superbull[0], allocation * multipliers.superbull[1]],
    gigabull: [allocation * multipliers.gigabull[0], allocation * multipliers.gigabull[1]],
  };

  showResult({ username, pfp: '', allocation, cases });
  formBox.classList.add('hidden');
  resultBox.classList.remove('hidden');
  startConfettiBurst();

  // Load Twitter PFP async
  fetch(`https://unavatar.io/twitter/${username}`)
    .then(res => {
      if (res.ok) return res.url;
      else throw new Error();
    })
    .then(url => {
      document.getElementById('twitter-pfp').src = url;
    })
    .catch(() => {
      document.getElementById('twitter-pfp').src =
        'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    });
};

// === Result Display ===
function showResult({ username, pfp, allocation = 0, cases = {} }) {
  document.getElementById('twitter-username').innerText = '@' + username;
  document.getElementById('twitter-pfp').src = pfp || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
  document.getElementById('allocation-amount').innerText = formatNum(allocation) + ' $U';

  if (!allocation) {
    ['ideal', 'bull', 'superbull', 'gigabull'].forEach(id =>
      document.getElementById(`${id}-value`).innerText = '—'
    );
  } else {
    document.getElementById('ideal-value').innerText = toUSD(cases.ideal);
    document.getElementById('bull-value').innerText = toUSD(cases.bull);
    document.getElementById('superbull-value').innerText = toUSD(cases.superbull);
    document.getElementById('gigabull-value').innerText = toUSD(cases.gigabull);
  }
}

function formatNum(n) {
  n = Math.round(n);
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}
function toUSD(arr) {
  return `~$${formatNum(arr[0])}–$${formatNum(arr[1])}`;
}

// === Share Tweet ===
document.getElementById('share-btn').onclick = function () {
  const username = document.getElementById('twitter-username').innerText.replace('@', '');
  const allocation = document.getElementById('allocation-amount').innerText;
  const tweet =
`Just calculated my $U allocation for @union_build testnet 🧮

My esteemated allocation is ${allocation} $U! 💥

Try it yourself 👉 https://union-testers.vercel.app\n`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  window.open(url, '_blank');
};

// === View Maths Thread ===
document.getElementById('math-btn').onclick = function () {
  window.open('https://twitter.com/your_math_thread_link', '_blank');
};
