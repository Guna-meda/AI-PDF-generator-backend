const puppeteer = require('puppeteer');
const path = require('path');
const { getImage } = require('./image.service');

const generatePDF = async (blueprint, job) => {
  console.log("PDF generation started");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });

  console.log("Building HTML...");
  const html = await buildHTML(blueprint);
  console.log("HTML built, length:", html.length);
  await job.updateProgress(60);

  console.log("Loading page...");
  await page.setContent(html, {
    waitUntil: 'load',
    timeout: 45000
  });

  // Extra safety: wait for all images
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });

  console.log("✅ Page loaded successfully");
  console.log("✅ All images loaded");
  await job.updateProgress(75);

  const filePath = path.join(
    process.cwd(),
    'outputs',
    `deck-${job.id}.pdf`
  );

  console.log("Creating PDF...");
  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });
  console.log("✅ PDF created");
  await job.updateProgress(90);

  await browser.close();

  return `/outputs/deck-${job.id}.pdf`;
};

const buildHTML = async (blueprint) => {
  const pages = await Promise.all(
    blueprint.pages.map(async (item, index) => {
      const image = item.imageQuery
        ? await getImage(item.imageQuery)
        : '';

      switch (item.layout) {
        case 'cover':
          return renderCover(item, image);

        case 'stats':
          return renderStats(item, image);

        case 'comparison':
          return renderComparison(item, image);

        case 'closing':
          return renderClosing(item, image);

        default:
          return renderContent(item, image, index + 1);
      }
    })
  );

  return `
  <html>
  <head>
    <style>
      *{
        box-sizing:border-box;
        margin:0;
        padding:0;
      }

      body{
        font-family: Arial, sans-serif;
        background:#fff;
        color:#111827;
      }

      .page{
        width:100%;
        height:1123px;
        padding:60px;
        page-break-after:always;
        position:relative;
        overflow:hidden;
      }

      h1{
        font-size:42px;
        line-height:1.15;
        margin-bottom:18px;
        color:#0f172a;
      }

      h2{
        font-size:28px;
        margin-bottom:12px;
        color:#0f172a;
      }

      p{
        font-size:18px;
        line-height:1.7;
        color:#475569;
      }

      .muted{
        color:#64748b;
      }

      .hero-img{
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .overlay{
        position:absolute;
        inset:0;
        background:linear-gradient(
          rgba(0,0,0,.45),
          rgba(0,0,0,.65)
        );
      }

      .cover-content{
        position:relative;
        z-index:2;
        color:white;
        top:32%;
      }

      .cover-content h1{
        color:white;
        font-size:54px;
        width:70%;
      }

      .cover-content p{
        color:#e2e8f0;
        font-size:22px;
        margin-top:18px;
      }

      .grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:40px;
        align-items:center;
      }

      .side-img{
        width:100%;
        height:420px;
        object-fit:cover;
        border-radius:18px;
      }

      .bullets{
        margin-top:20px;
      }

      .bullets li{
        margin-bottom:14px;
        font-size:18px;
        line-height:1.6;
        color:#334155;
      }

      .stats{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:22px;
        margin-top:30px;
      }

      .card{
        padding:28px;
        border-radius:18px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
      }

      .value{
        font-size:34px;
        font-weight:bold;
        color:#0f172a;
      }

      .label{
        margin-top:8px;
        color:#64748b;
        font-size:15px;
      }

      .footer{
        position:absolute;
        bottom:28px;
        left:60px;
        font-size:13px;
        color:#94a3b8;
      }

      .quote{
        font-size:34px;
        line-height:1.4;
        color:#0f172a;
        width:80%;
      }

      .cta{
        font-size:22px;
        margin-top:25px;
        color:#475569;
      }
    </style>
  </head>
  <body>
    ${pages.join('')}
  </body>
  </html>
  `;
};

const renderCover = (item, image) => `
<div class="page">
  <img class="hero-img" src="${image}" onerror="this.style.display='none'" />
  <div class="overlay"></div>

  <div class="cover-content">
    <h1>${item.title}</h1>
    <p>${item.subtitle || ''}</p>
  </div>
</div>
`;

const renderStats = (item, image) => `
<div class="page">
  <div class="grid">
    <div>
      <h1>${item.title}</h1>
      <p>${item.summary || ''}</p>

      <div class="stats">
        ${(item.stats || []).map(stat => `
          <div class="card">
            <div class="value">${stat.value}</div>
            <div class="label">${stat.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div>
      <img class="side-img" src="${image}" onerror="this.style.display='none'" />
    </div>
  </div>
</div>
`;

const renderContent = (item, image, num) => `
<div class="page">
  <div class="grid">
    <div>
      <h1>${item.title}</h1>
      <p>${item.summary || ''}</p>

      <ul class="bullets">
        ${(item.bullets || []).map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>

    <div>
      <img class="side-img" src="${image}" onerror="this.style.display='none'" />
    </div>
  </div>

  <div class="footer">Page ${num}</div>
</div>
`;

const renderComparison = (item, image) => `
<div class="page">
  <h1>${item.title}</h1>
  <p>${item.summary || ''}</p>

  <div class="stats">
    ${(item.stats || []).map(stat => `
      <div class="card">
        <div class="value">${stat.value}</div>
        <div class="label">${stat.label}</div>
      </div>
    `).join('')}
  </div>

  <img class="side-img" style="margin-top:35px;height:320px;" src="${image}" onerror="this.style.display='none'" />
</div>
`;

const renderClosing = (item, image) => `
<div class="page">
  <img class="hero-img" src="${image}" onerror="this.style.display='none'" />
  <div class="overlay"></div>

  <div class="cover-content">
    <div class="quote">${item.title}</div>
    <div class="cta">${item.subtitle || ''}</div>
  </div>
</div>
`;

module.exports = {
  generatePDF
};