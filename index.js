const fs = require("fs");
const { chromium } = require("playwright");
const providers = require("./providers.json");

const randomDelay = () =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000)
  );

(async () => {
  const browser = await chromium.launch({ headless: false });

  let results = [];

  for (const provider of providers) {
    await randomDelay();

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`🔄 Procesando RUT: ${provider.rut}`);

    await page.goto(
      "https://clave.w.sii.cl/oauthsii-v1/?response_type=code&client_id=e0378e96-4014-4a47-b852-9d9246797f5c&redirect_uri=https://eboleta.sii.cl/emitir/&scope=user_info&state=730b12d3-0586-42cb-8d8e-57c15125a8a9"
    );

    await page.waitForSelector("#auth_bottom > input");
    await page.waitForSelector("#inputPass");

    const delay = Math.floor(Math.random() * 400) + 100;

    await page.fill("#auth_bottom > input", provider.rut, { delay: delay });
    await page.fill("#inputPass", String(provider.pass), { delay: delay });

    await page.click("#bt_ingresar");

    await page.waitForTimeout(7000);

    const links = await page.evaluate(() => {
      const json = JSON.parse(
        localStorage.getItem("aws-amplify-federatedInfo")
      );
      if (!json || !json.user) return null;

      return {
        rut: json["user"]["username"].toUpperCase(),
        link1: `https://backoffice.agendapro.com/tready/eboleta_tokens/new?r=${json[
          "user"
        ]["username"].toUpperCase()}&i=${json["identity_id"]}&t=${
          json["token"]
        }`,
        link2: `https://backoffice.agendapro.com/tready/eboleta_tokens?q%5Brut_eq%5D=${json[
          "user"
        ]["username"].toUpperCase()}`,
      };
    });

    if (links) {
      console.log(`🔗 Link 1 para ${provider.rut}: ${links.link1}`);
      console.log(`🔗 Link 2 para ${provider.rut}: ${links.link2}`);
      results.push(links);
    } else {
      console.log(
        `❌ No se encontraron datos en localStorage para ${provider.rut}`
      );
    }

    // await page.waitForTimeout(4000);
    await context.close();
  }

  // Guardar resultados en results.json
  fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
  console.log("✅ Resultados guardados en results.json");

  await browser.close();
})();
