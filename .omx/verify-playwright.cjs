const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) =>
    consoleMessages.push({ type: msg.type(), text: msg.text() }),
  );
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("http://127.0.0.1:3001", { waitUntil: "networkidle" });
  await page.screenshot({
    path: "D:/agentBrow/100xint-tool/LLM-wiki/Blog8byte/blog8byte/.omx/homepage-3001.png",
    fullPage: true,
  });

  const html = await page.content();
  console.log(
    JSON.stringify(
      {
        title: await page.title(),
        hasHydrationText: html.includes(
          "hydrated but some attributes of the server rendered HTML didn't match",
        ),
        consoleMessages,
        pageErrors,
      },
      null,
      2,
    ),
  );

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
