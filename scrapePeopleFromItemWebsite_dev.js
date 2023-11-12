// WARNING: don't use console.log here for debug, use console.error instead. STDOUT is used to deliver output data

import { myBrowser } from "./browser.js";

// find value of input process argument with --input-data
const inpDataB64 = process.argv.find((a) => a.startsWith('--input-data')).replace('--input-data', '')
const inputData = await JSON.parse(Buffer.from(inpDataB64, 'base64').toString())

// console.log(inputData.url);  // print out data to STDOUT
const proxyIP = '184.169.231.206';
const proxyPort = '3000';
const proxyServer = 'http://' + proxyIP + ':' + proxyPort;

const browser = await myBrowser.start(proxyServer);
const itemPage = await browser.newPage();
const website_url = inputData.website;
// const itemHTMLFile = "./" + itemIndice + '.html';

// read the file content from itemHTMLFile
//const html = fs.readFileSync(itemHTMLFile, 'utf8', function (err, data) {
//    if (err)
//        return err;
// Display the file content
// console.log(data);
//    return data;
//});

// await itemPage.setContent(html, { timeout: 60000 });

// await itemPage.goto(url, { timeout: 60000 });
const url_contact_pages = ['', 'contact-us', 'contact'];
const websiteInfo = {
    
};
const outputData = await websiteInfo.getData(website_url);

await itemPage.close();
await browser.close();

console.log(JSON.stringify(outputData))  // print out data to STDOUT