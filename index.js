
import { myBrowser } from './browser.js';
import { scrapeData } from './scrape.js'
// import { departements } from './locations/departements_france.js'
import path from 'path';
import fs from "fs";

var retry01 = 0;
var retry02 = 0;
const max_retry01 = 100; // Geting listing page HTML with scraperAPI 
const max_retry02 = 2;

var allScrapedData = [];



// Get the listing page HTML
const proxyIP = '184.169.231.206';
const proxyPort = '3000';
// const proxyServer = 'http://' + proxyIP + ':' + proxyPort;
const proxyServer = '';
const site01 = 'https://mail.google.com/mail';
const url = site01;

// Create page
const browser = await myBrowser.start(proxyServer); // start a browser
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

// set page's browser user agent
const agents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36" ,"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"];
// import randomUseragent from 'random-useragent';
// set request interception
var randomAgents = agents[Math.floor(Math.random() * agents.length)];
// const randomAgents = randomUseragent.getRandom(); // gets a random user agent string
await page.setUserAgent(randomAgents);
	
await page.setViewport({
	width: 1366,
	height: 768,
	//deviceScaleFactor: 1,
	//hasTouch: false,
	// isLandscape: true,
	//isMobile: false,
});

// goto
await page.goto( url, {timeout: 0} );

// Login
const username = 'videocm01@gmail.com';
const password = 'cvBn58965!';
const nextBtnX = "//span[contains( ., 'Next') ]";
var elts = '';
try{
	// type the login
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
	
}
catch(e){
	console.log( e.message );
}	

// Click to List all messages
const moreBtnX = "//span[contains( @role, 'button' )]/span[ contains( .,'More' )]/..";
const allMailX = "//a[contains(., 'All Mail' )]";
const allItemsX = "((//td//div[ contains( @title, 'Inbox' ) ])[4]//div[ contains( ., 'Inbox' )])[2]//ancestor::table[1]//tr";
var count_items_loaded 	= 0;
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
console.log( 'All Mail btn clicked. Loading data... ' );
	
	// load data
	var countCountLoadedDataRetry 		= 0;
	const countCountLoadedDataMaxRetry 	= 3; 
	const countLoadedData = async() => {
		try{
			await page.waitForXPath( allItemsX, {timeout:360000} ); // up to 6 min
			var allItems = await page.$x( allItemsX );
			count_items_loaded = await page.evaluate(allItems => allItems.length, allItems );
		}
		catch( err ){
			if( countCountLoadedDataRetry <= countCountLoadedDataMaxRetry ){ // retry
console.log( 'countLoadedData retry n° ' + countCountLoadedDataRetry + '/' + countCountLoadedDataMaxRetry );
				countCountLoadedDataRetry++;
				await countLoadedData();
			}
		}
	}
	await countLoadedData();
	//
}
catch(e){
	console.log( 'Click More btn error: ' + e.message );
}	

// Scrape 
// const subject  = 'Stockholm Photography';
// const location = 'Stockholm';
await scrapeData.scraping( page, count_items_loaded, allItemsX );

// save file
async function save_file( path, data ) {
    await fs.writeFile( path, JSON.stringify( data ), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log( '' );
        console.log( "Data are successfully saved. View it at " + path );
        console.log( '' );
        console.log( '' );
    });
    return true;
}

console.log( "Gmail scraped." ); 

console.log( '' );
console.log( '<<<' );
console.log( 'Finished' );

