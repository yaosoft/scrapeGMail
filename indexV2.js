import { myBrowser } from './browser.js';
import { scrapeData } from './scrape.js'

var retry01 = 0;
var retry02 = 0;
const max_retry01 = 100; // Geting listing page HTML with scraperAPI 
const max_retry02 = 2;

var allScrapedData = [];
// const resp = await scraperAPI(); // Commented if not used
// const statusUrl = resp.data.statusUrl;
// const statusUrl = "https://async.scraperapi.com/jobs/a787c7e4-032f-4305-a87b-2378d41cdd5a";
// console.log('List page status URL: ' + statusUrl);

// start nodejs proxy
// import {proxy} from './proxy.js';
// const proxyOk = await proxy.createProxy(proxyIP, proxyPort);
// console.log('proxy ok: ' + proxyOk );

//import useProxy from 'puppeteer-page-proxy';
//await useProxy(page, proxyServer);
//const data = await useProxy.lookup(page);
//console.log('ip: ' + data.ip);


// await page.setJavaScriptEnabled(true);

// Get the listing page HTML
const proxyIP = '184.169.231.206';
const proxyPort = '3000';
// const proxyServer = 'http://' + proxyIP + ':' + proxyPort;
const proxyServer = '';
const site01 = 'https://mail.google.com/mail/u/0/#all/';
//const site02 = 'file:///C:/Apache24/htdocs/test/page02.html';
const url = site01;


// Loop urls and scrape
const laspPage = 10;
// start the browser
const browser = await myBrowser.start(proxyServer); // start a browser
for( var i = 0; i < laspPage; i++ ){
    
    const page = await browser.newPage();
    // await page.setRequestInterception(true)
    // await page.on('request', (req) => {
		// if (
			// req.resourceType() === 'image' ||
			// req.resourceType() == 'stylesheet' ||
			// req.resourceType() == 'font'
		// ) {
			// req.abort();
		// }
		// else {
			// req.continue();
		// }
    // });

    // await page.setCacheEnabled(false);
    
	// set page's browser client
	const agents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36" ,"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"];
	// import randomUseragent from 'random-useragent';
	// set request interception
	var randomAgents = agents[Math.floor(Math.random() * agents.length)];
	// const randomAgents = randomUseragent.getRandom(); // gets a random user agent string
	await page.setUserAgent(randomAgents);
 
	// goto
	const link = url + 'p' + i;
	await page.goto( link, {timeout: 0} );

    // Log in if not loged already
	const username = 'videocm01@gmail.com';
	const password = 'cvBn58965!';
	const nextBtnX = "//span[contains( ., 'Next') ]";
	try{
		// type the login
		await page.waitForXPath( "//input[@type='email']", { timeout: 5000 } );
		await page.type( "input[type=email]", username );
		// click next
		const elts01 = await page.$x( nextBtnX );
		await page.evaluate(  btn => btn.click(), elts01[0] );
		await new Promise(r => setTimeout(r, 5000));
		// type the password
		await page.type( "input[type=password]", password );
		// click next
		const elts02 = await page.$x( nextBtnX );
		await page.evaluate(  btn => btn.click(), elts02[0] );
		await new Promise(r => setTimeout(r, 5000));
		// 2 factor authentification + login
		// await page.click( "button[type=submit]" );
		// Click to List all messages
		const moreBtnX = "//span[contains( @role, 'button' )]/span[ contains( .,'More' )]/..";
		const allMailX = "//a[contains(., 'All Mail' )]";
		try{
			// click More btn
			await page.waitForXPath( moreBtnX, {timeout:300000} );
			const elts03 = await page.$x( moreBtnX );
    		await elts03[0].hover();
    		await elts03[0].click();
			// await page.evaluate( btn => btn.click(), elts03[0] );

console.log( 'More btn clicked' );
			// click All Mail btn
			await page.waitForXPath( allMailX, {timeout:60000} );
			const elts04 = await page.$x( allMailX );
			await elts04[0].hover();
			await elts04[0].click();
			//await page.evaluate( btn => btn.click(), elts04[0] );
console.log( 'All Mail btn clicked' );
		}
		catch(e){
			console.log( 'Click More btn error: ' + e.message );
		}	
	}
	catch(e){
		console.log( 'Already loged' );
		// console.log( e.message );
	}	
	
    // Scrape the page
    const rep = await scrapeData.scraping( page, i );
	
console.log( rep );

    // close the browser
    await page.close();
    console.log( '' );
    console.log( "Page " + i + " scraped." );
    console.log( '' );
}


await browser.close();
	
console.log( '' );
console.log( '<<<' );
console.log( 'Finished' );
