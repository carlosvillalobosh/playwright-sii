const fs = require("fs");
const { chromium } = require("playwright");
const axios = require("axios");
const providers = require("./providers.json");

const WEBHOOK_URL =
  "https://n8n.agendapro-bizops.com/webhook/da24e7fd-af7e-490e-92a9-07809a71c17d";
const randomDelay = () =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000)
  );

async function sendToWebhook(data) {
  try {
    const response = await axios.post(WEBHOOK_URL, data);
    console.log(
      `✅ Webhook recibido para ${data.rut} (Status: ${response.status})`
    );
    return true;
  } catch (error) {
    console.error(`⚠️ Error enviando webhook para ${data.rut}:`, error.message);
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false });

  let results = [];
  let failedProviders = [];

  for (const provider of providers) {
    try {
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

      await page.waitForTimeout(8000);

      const links = await page.evaluate(() => {
        const federatedInfo = localStorage.getItem("aws-amplify-federatedInfo");
        if (!federatedInfo) return null;

        const json = JSON.parse(federatedInfo);
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

        // Enviar al webhook
        const webhookData = {
          rut: links.rut,
          link1: links.link1,
          link2: links.link2,
          timestamp: new Date().toISOString(),
        };
        await sendToWebhook(webhookData);
      } else {
        console.log(
          `❌ No se encontraron datos en localStorage para ${provider.rut}`
        );
        failedProviders.push(provider);
      }

      await context.close();
    } catch (error) {
      console.error(`⚠️ Error procesando ${provider.rut}:`, error.message);
      failedProviders.push(provider);
      continue;
    }
  }

  // Guardar resultados exitosos
  fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
  console.log("✅ Resultados guardados en results.json");

  // Guardar proveedores fallidos
  if (failedProviders.length > 0) {
    fs.writeFileSync(
      "failed_providers.json",
      JSON.stringify(failedProviders, null, 2)
    );
    console.log(
      `⚠️ Se guardaron ${failedProviders.length} proveedores fallidos en failed_providers.json`
    );
  } else {
    console.log("🎉 Todos los proveedores se procesaron exitosamente");
  }

  await browser.close();
})();
