const fs = require("fs/promises");
const puppeteer = require("puppeteer");

let issues = [];
let articles = [];

function randomTime() {
  const h = String(Math.floor(Math.random() * 24)).padStart(2, "0");
  const m = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  const s = String(Math.floor(Math.random() * 60)).padStart(2, "0");

  return `${h}:${m}:${s}+00:00`;
}

const START_URL = "https://multiarticlesjournal.com/archive";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000, // 60  sec
  });

  issues = await page.$$eval(".col-md-4 a", (anchors) =>
    anchors.map((a) => ({
      href: a.href,
      text: a.innerText.trim(),
    })),
  );

  const page2 = await browser.newPage();

  for (const obj of issues) {
    console.log("Visiting:", obj.href);

    await page2.goto(obj.href, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const articleArr = await page2.$$eval(
      ".col-md-12.border.py-2.my-1.text-left > a",
      (anchors) => anchors.map((a) => a.href),
    );

    articles.push(...articleArr);
  }

  const page3 = await browser.newPage();

  for (const article of articles) {
    await page3.goto(article);

    const lastMod = await page3.$$eval("div.col-md-4", (divs) => {
      const target = divs.find((div) =>
        div.innerText.includes("Paper Published on"),
      );

      if (!target) return null;

      return target.innerText.replace("Paper Published on:", "").trim();
    });

    const downloadLink = await page3.$$eval("a.blink-button", (anchors) => {
      const a = anchors.find((a) => a.innerText.includes("Download PDF"));

      if (!a) return null;

      const onclick = a.getAttribute("onclick");

      const match = onclick.match(/downloads\('(.+?)',\s*'(.+?)'\)/);

      if (!match) return null;

      const ref = match[1];
      const file = match[2];

      return `https://multiarticlesjournal.com/counter/d/${ref}/${file}`;
    });

    const str = `
    <url>
      <loc>${article}</loc>
      <loc>${downloadLink}</loc>
      <lastmod>${lastMod}T${randomTime()}</lastmod>
      <priority>0.80</priority>
    </url>
    `;

    // do something
    await fs.appendFile("./sitemap.xml", `${str}\n`);
    await page3.goBack();
  }

  await browser.close();

  // for (const article of articles) {
  //  await fs.appendFile("./articles.txt", `${article}\n`);
  // }
})();

// const objs = [];
// (async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   for (const obj of issues) {
//     console.log("Visiting:", obj.href);

//     await page.goto(obj.href, {
//       waitUntil: "domcontentloaded",
//       timeout: 30000,
//     });

//     const articleArr = await page2.$$eval(".col-md-12 a", (anchors) =>
//       anchors.map((a) => a.href),
//     );

//     articles.push(...articleArr);
//   }

//   await browser.close();

//   // write a json file
// })();
