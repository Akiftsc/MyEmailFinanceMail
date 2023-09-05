const axios = require('axios');
const puppeteer = require('puppeteer')
const { format } = require('date-fns');
const { tr } = require("date-fns/locale");
const { Resend } = require("resend");
const { writeFile } = require('fs');
const stocks = [
    { name: "BIMAS", total: 20, purchasePrice: 186 },
    { name: "TKNSA", total: 68, purchasePrice: 24 },
    { name: "CCOLA", total: 4, purchasePrice: 400 },
];
const URLS = { news: "https://www.foreks.com/api/news/last?last=10&locale=tr&source=PICNEWS", stocks, currency: "https://api.genelpara.com/embed/para-birimleri.json" };

const resend = new Resend('re_bSSr8gE4_PUVFoupCaKwX1tk4PUZk2vrR');


async function getCurrency() {
    try {
        const response = await axios.request({ method: "GET", url: URLS.currency });
        const doviz = response.data;
        dolar = Number(doviz.USD.alis).toFixed(2);
        euro = Number(doviz.EUR.alis).toFixed(2);
        btc = Number(doviz.BTC.alis).toFixed(0);
        eth = Number(doviz.ETH.alis).toFixed(0);

        return { dolar, euro, btc, eth };

    } catch (error) {
        console.error(error);
    }
}

async function getStocks() {
    let stockResults = { curr: [], formattedTotalProfit: 0 };
    let totalProfit = 0;

    try {
        for (const stock of URLS.stocks) {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stock.name}.IS?region=TR&lang=tr-TR`;
            const response = await axios.request({ method: "GET", url, headers: { 'User-Agent': 'request' } });
            const currency = response.data.chart.result[0].meta.regularMarketPrice;
            stockResults.curr.push({
                name: stock.name,
                total: stock.total,
                sellPrice: currency,
                profit: ((currency - stock.purchasePrice) * stock.total).toFixed(2),
                purchasePrice: stock.purchasePrice
            });
            const profit = ((currency - stock.purchasePrice) * stock.total);
            totalProfit += profit;
        }

        const formattedTotalProfit = totalProfit.toFixed(2);

        stockResults.formattedTotalProfit = formattedTotalProfit;

        return stockResults;

    } catch (error) {
        console.error(error);
    }
}


async function getNews() {
    try {
        const browser = await puppeteer.launch({});
        const page = await browser.newPage();
        await page.goto("https://www.foreks.com")

        await page.goto(URLS.news);
        await page.content();

        data = await page.evaluate(() => {
            return JSON.parse(document.querySelector("body").innerText);
        });

        articles = data.map(article => ({ name: article.header, content: article.summary, link: article.content }));


        browser.close();

        return articles;
    } catch (error) {
        console.error(error);
    }

}

async function sendEmail(body) {
    resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'akiftsc41@gmail.com',
        subject: 'Hello World',
        html: body
    });
}


async function main() {
    const stocks = await getStocks();
    const currencies = await getCurrency()
    const date = format(new Date(), "yy MMMM h':'m ", { locale: tr });

    const mailBody = `
      <!DOCTYPE html>
<html lang="tr" ">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width" initial-scale="1">
    <meta name="x-apple-disable-message-reformatting">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=EB+Garamond:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <title>Piyasa Gündemi</title>
    <style type="text/css">
        @media screen and (max-width: 750px) {
            .container {
                width: 100%;
                margin: auto;
            }
        }

        /** put css here */
    </style>
</head>

<body
    style="font-size:24px;font-family:'DM Serif Display', serif;margin:0;width:100%;text-rendering:optimizeLegibility;">
    <table class="container" align="center"
        style="background:#e5f8c0;text-align:center;margin: 0 auto;max-width: 700px; width: 100%; border-spacing: 0;"
        role="presentation" width="700">
        <tbody>
            <tr>
                <td align="center">
                    <h1 class="title" style="color:#0c6c34;font-size:48px;">
                        Finans Gündemi 💸
                    </h1>
                    <p style="font-size: 20px;color:#0c6c34;">${date}</p>
                </td>
            </tr>
            <tr>
                <td>
                    <table class="container currencies" align="center"
                        style="background:#e5f8c0;text-align:center;width:100%;display:block;height:100%;padding:8px 0;max-width:700px;padding:8px;font-size:24px;color:#f0f8ff;background:#0c6c34b0;">
                        <tbody width="700px" align="center">
                            <tr align="center" class="ctitle">
                                <td align="center">
                                    <h1 style="width:700px;font-size:36px;color:inherit;text-align:center;">Döviz</h1>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <p style="text-align:left;margin:0 70px;display:inline;">💵 Dolar Kuru: ${currencies.dolar}₺</p>
                                    <p style="text-align:left;margin:0 70px;display:inline;">⧫ ETH: ${currencies.eth}₺</p>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <p style="text-align:left;margin:0 70px;display:inline;">💶 Euro Kuru: ${currencies.euro}₺</p>
                                    <p style="text-align:left;margin:0 70px;display:inline;">₿ BTC: ${currencies.btc}₺</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td>
                    <table class="container stocks" align="center"
                        style="background:#e5f8c0;display:block;height:100%;padding:8px 0;max-width:700px;padding:8px;font-size:24px;color:#0c6c34b0;text-align:center;width:100%;">
                        <tbody width="700px" align="center">
                            <tr align="center" class="ctitle">
                                <td align="center">
                                    <h1 style="width:700px;font-size:36px;color:inherit;text-align:center;">Hisse Senetleri</h1>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <table style="text-align:center;width:100%;">
                                        ${stocks.curr.map(stock => `
                                        <tr>
                                            <td class="currenyTable" style="padding:0px 30px;margin:10px 0;">
                                                <table width="100%" align="center" role="presentation"
                                                    style="border-spacing:0;border-radius:4px;outline:2px #0c6c34 solid;margin:10px 0px;text-align:center;width:100%;">
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding: 0px 30px;">
                                                                <h1 class="currenyTitle">
                                                                    ${stock.name}
                                                                </h1>
                                                            </td>
                                                            <td align="left" class="currencySide"
                                                                style="padding:0px 30px;background-color:#0c6c34;color:#e5f8c0;">
                                                                <p style="font-size:24px;">
                                                                    Toplam: ${stock.total}₺
                                                                </p>
                                                                <p style="font-size:24px;">
                                                                    Alınan Fiyat: ${stock.purchasePrice}₺
                                                                </p>
                                                                <p style="font-size:24px;">
                                                                    Güncel Satış: ${stock.sellPrice}₺
                                                                </p>
                                                                <p style="font-size:24px;">
                                                                    Kâr: ${stock.profit}₺
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    `)}


                                    </table>
                                    <p style="background-color: #0c6c34;color: #e5f8c0; padding: 10px; width:600px">
                                        ⚠ Toplam Kâr/Zarar: <b>${stocks.formattedTotalProfit}₺</b>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>

</html>
        
  `
    sendEmail(mailBody);
}

main();
