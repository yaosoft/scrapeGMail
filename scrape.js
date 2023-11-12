import { spawn } from 'child_process';
import path from 'path';
import fs from "fs";

// import { scrapePeopleFromItemWebsite_dev } from './scrapePeopleFromItemWebsite_dev.js'; 
// import util from 'util';
// import { myBrowser } from "./browser.js";
// import { Objects } from './objects_array.js';
// import { USAStatesCode } from './USAStatesCode.js';
// console.log(inputData.url);  // print out data to STDOUT

const scrapeData = {

    async scraping( page, page_current ) {
        var allScrapedData = [];

        // const allItemsX = "//div[ @role = 'main']//tr/td[5]";
		const allItemsX = "//div[.='Inbox'] //ancestor::td[1]";
		const countCountLoadedDataRetry = 0;
		var items_loaded = 0;
		const countCountLoadedDataMaxRetry = 3; 
		const countLoadedData = async() => {
			try{
				await page.waitForXPath( allItemsX, {timeout:360000} ); // up to 6 min
				var allItems = await page.$x( allItemsX );
				items_loaded = await page.evaluate(allItems => allItems.length, allItems );
			}
			catch( err ){
				if( countCountLoadedDataRetry <= countCountLoadedDataMaxRetry ){ // retry
console.log( 'countLoadedData retry n° ' + countCountLoadedDataRetry + '/' + countCountLoadedDataMaxRetry );
					countCountLoadedDataRetry++;
					await countLoadedData();
				}
				
				countLoadedData ++;
			}
		}
		await countLoadedData();			
		

        // var items_loaded = await page.$$eval(all_items_selector, (items) => items.length);   // the number or items loaded after a click
        // items_loaded = items_loaded - 3;
        var total_items_loaded = items_loaded;   // await page.$$eval(all_items_selector, (items) => items.length);   // the number or items loaded variable of the total number of items currenly present
console.log(total_items_loaded);
        const page_total = 1000;        // the last pages if next button exixts
        const page_first =  0;         // first page to start crawling with
        const page_last  = page_total; // page_total -1;   // the last page to scrap
        // var page_counter = 0;

        const item_first = 0;           // first item to start crawling with
        const item_last = items_loaded - 1;  // last item to stop crawling for a page

        var page_current = 0;
        var retry01 = 0;
        const max_retry01 = 10;
        const max_retry02 = 5;
        const max_retry03 = 3;
        const max_retry04 = 10;     // Next button
        
        var indices = {};
        var itemIndices = {};
        itemIndices['firstItemIndice'] = item_first;
        itemIndices['lastItemIndice'] = item_last;
        var comparator = 0;
        var startSkiping = 0;

        const proxyIP = '184.169.231.206';
        const proxyPort = '3000';
        // const proxyServer = 'http://' + proxyIP + ':' + proxyPort;
        const proxyServer = '';

        const __dirname = path.resolve();

        async function runPupeteer(data) {
            const jsonData = JSON.stringify(data)
            const b64Data = Buffer.from(jsonData).toString('base64');
            let stdoutData = '';
            return await new Promise((resolve) => {
                const proc = spawn('node', [
                    path.resolve(__dirname, data.puWorker),
                    `--input-data${b64Data}`,
                    '--tagprocess'
                ], { shell: false });
                proc.stdout.on('data', (data) => {
                    stdoutData += data;
                });
                proc.stderr.on('data', (data) => {
                    console.error(`NodeERR: ${data}`);
                });
                proc.on('close', async (code) => {
                });
                proc.on('exit', function () {
                    proc.kill();
                    resolve(JSON.parse(stdoutData));
                });
            });
        }

        async function scrapeCurrentPage() {
            
            // Click next
            async function clickNext() {
                // await page.bringToFront();
// await page.screenshot({ path: 'screenshot02.png', fullPage: true });
                var nextPageButtonX = "//div[contains(@role, 'toolbar')]/following-sibling::div/div/following-sibling::div/div/span/div/following-sibling::div/following-sibling::div";
                let nextButtonExist = false;
                try {
                    // const nextButton = await page.$eval(nextPageButtonSelector, button => button);
                    // nextButtonExist = true;
                    const nextButton = await page.waitForXPath( nextPageButtonX );
                    nextButtonExist = true;
                }
                catch (err) {
                    console.log(err.message);
                    nextButtonExist = false;
                }
                if (nextButtonExist) {
                    try{
                        // scrool
                        const elems = await page.$x( nextPageButtonX );
                        // await page.evaluate( button => button.click(), elem[0] );
						await elems[0].hover();
						await elems[0].click();
						await new Promise(r => setTimeout(r, 5000)); // loading left zone items
                        // await new Promise(r => setTimeout(r, 20000));
console.log('> Next page clicked: ' )
                    }
                    catch(err){
                        console.log('> Next clicked: ' + err)
                    }
                }
                else {
                    console.log('> This is the last page.')
                    return false;
                }
            }
            // click to reach the page to scrape
            if (page_current < page_first) {
                comparator = page_first;
                startSkiping = 0;

            }
            else if (page_current >= page_first) {
                if (page_current == 0) {
                    startSkiping = comparator + 1; // no skiping
                    page_current++; // unique case where page_current++ outside the click loop
                }
                else {
                    comparator = page_current + 1;     // one skiping
                    startSkiping = page_current;
                }
            }
// Don't change here
// console.log('comparator: ' + comparator + ', startSkiping: ' + startSkiping + ', page_first: ' + page_first + ', page_current: ' + page_current)
            for (var j = startSkiping; j < comparator; j++) { // click loop
                
                const next = await clickNext(); 
                if( next === false )
                    return true;

                await page.waitForXPath( allItemsX, {timeout:120000} );
                
                allItems = await page.$x(allItemsX);
                total_items_loaded = await page.evaluate(allItems => allItems.length, allItems);
				
//	total_items_loaded
total_items_loaded = 1;			
				
                // let prev_total_items_loaded = total_items_loaded; // store the previous total loaded value
                //total_items_loaded = await page.waitForSelector(all_items_selector, { timeout: 120000 })
                //.then(async () => {
                //     var toreturn = await page.$$eval(all_items_selector, (items) => { // count loaded and previous
                //        return items.length;
                //    });
                //    return toreturn;

                //});

console.log('>> Page ' + j + ' skiped.');
console.log('total_items_loaded: ' + total_items_loaded );

                //page_counter++;     // count skiped pages
                page_current++;

                // count loaded datas
                // let toCheck = prev_total_items_loaded + 1; // at least one new ittem
                // console.log('toCheck: ' + toCheck);

                // next first and last item indices
                //itemIndices['firstItemIndice'] = itemIndices.firstItemIndice + items_loaded;   // The new first indice
                //itemIndices['lastItemIndice'] = itemIndices.lastItemIndice + items_loaded;   // The new first indice          // The new last indice
                itemIndices['firstItemIndice'] = 0;   // The new first indice
                itemIndices['lastItemIndice'] = total_items_loaded-1;   // The new first indice  

                if ( itemIndices.lastItemIndice > items_loaded )
                    itemIndices['lastItemIndice'] = total_items_loaded - 1;

                        // The new last indice
            }

// to here ////

			// returning a promise to the for loop for items of the page iteration
            async function scrape_from_list(itemIndice) {
                var dataObj = {};

				// get a mail's data
				
                return new Promise( async (resolve, reject) => {
                    
					var clickAMailRetry = 0;
					const clickAMailMaxRetry = 3;
					const clickAMail = async() => {
						try{
							// wait all Inbox buttons be displayed
							const allItemsX = "//div[ @role = 'main']//tr/td[5]"; // diffenrent from the declarative one
							await page.waitForXPath( allItemsX, {timeout:360000} ); // up to 6 min
							const pupupItems = await page.$x( allItemsX );
							const pupupItem  = await pupupItems[ itemIndice ];
						
							// click to open the mail
							await pupupItem.hover();								
							await pupupItem.click();
						}
						catch( err ){
							if( clickAMailRetry <= 3 ){
console.log( 'clickAMail retry n° ' + clickAMailRetry + '/' + clickAMailMaxRetry );
								await clickAMail();
							}
							else{
								reject( dataObj ); // 
							}
							clickAMailRetry++;
						}
					}
					clickAMail();
					
					
					// Mail sender's name
                    const mailSenderNameX = "//div[1]/div[2]/div[1]/table/tbody/tr[1]/td[1]/table/tbody/tr/td/h3/span[1]/span[1]/span";
                    var mailSenderName = '';
                    try {
                        const els = await page.$x( mailSenderNameX );
                        await page.waitForXPath( mailSenderNameX, {timeout:10000} );
                        mailSenderName = await page.evaluate(el => el.textContent, els[0] )
                    }
                    catch (err) {
                        console.log('-! Mail sender\' name: ' + err.message);
                        mailSenderName = '';
                    }
                    
                    // Mail sender's email
                    const mailSenderEmailX = "//div[1]/div[2]/div[1]/table/tbody/tr[1]/td[1]/table/tbody/tr/td/h3/span[1]/span[3]";
                    var mailSenderEmail = '';
                    try {
                        const els = await page.$x( mailSenderEmailX );
                        await page.waitForXPath( mailSenderEmailX, {timeout:10000} );
                        mailSenderEmail = await page.evaluate(el => el.textContent, els[0] )
                    }
                    catch (err) {
                        console.log('-! Mail sender\'s emai issue: ' + err.message);
                        mailSenderEmail = '';
                    }
					
                    // Mail title
                    const mailTitleX = "//div//h2[ @data-thread-perm-id ]";
                    var mailTitle = '';
                    try {
                        const els = await page.$x(mailTitleX);
                        await page.waitForXPath( mailTitleX, {timeout:10000} );
                        mailTitle = await page.evaluate(el => el.textContent, els[0] )
                    }
                    catch (err) {
                        console.log('-! Mail title issue: ' + err.message);
                        mailTitle = '';
                    }
					
					// Mail date
					const mailDateX = "//div//h2[ @data-thread-perm-id ]//ancestor::div[4]/following-sibling::div//div[@role='listitem']//table//tr/td/following-sibling::td";
                    var mailDate = '';
                    try {
                        const els = await page.$x(mailDateX);
                        await page.waitForXPath( mailDateX, {timeout:10000} );
                        mailDate = await page.evaluate(el => el.textContent, els[0] )
                    }
                    catch (err) {
                        console.log('-! Mail date issue: ' + err.message);
                        mailDate = '';
                    }
					
                    // Mail
                    const mailX = "//div//h2[ @data-thread-perm-id ]//ancestor::div[4]/following-sibling::div//div[@role='listitem']";
                    var mail = '';
                    try {
                        await page.waitForXPath(mailX, { timeout: 5000 });
                        const els = await page.$x(mailX);
                        mail = await page.evaluate(el => el.textContent, els[0]) // 6 is ok
                    }
                    catch (err) {
                        console.log('-! Mail issue: ' + err.message);
                        mail = '';
                    }

                    // Collect
                    dataObj['SenderName'] 	= await mailSenderName.trim();
                    dataObj['SenderEmail'] 	= await mailSenderEmail.trim();
                    dataObj['MailTitle'] 	= await mailTitle.trim();
					dataObj['MailDate'] 	= await mailDate.trim();
					dataObj['Mail'] 		= await mail.trim();    

                    // return to mail list;
					await page.goBack();
					
					// resolve
					await resolve(dataObj);
                    
                })
            }


            // helper to heck if an objct is empty
            function isEmptyObject(obj) {
                for (const prop in obj) {
                    if (Object.hasOwn(obj, prop)) {
                        return false;
                    }
                }
                return true;
            }

            // object to string helper
            function objToString(obj) {
                let str = '';
                for (const [p, val] of Object.entries(obj)) {
                    str += `${p}::${val}\n`;
                }
                return str;
            }

console.log( '' );
console.log(itemIndices);

            // scrape current page mails
            for (var i = itemIndices.firstItemIndice; i <= itemIndices.lastItemIndice; i++) {
console.log( '' );
console.log( 'Page: ' + page_current + ', item: ' + i );
console.log( '' );

                // Get data from the list page
                const data01 =  await scrape_from_list( i );

                // save
                await allScrapedData.push( data01 );

console.log('data01');
console.log(data01);
console.log( '' );
console.log( '' );
 
            }
            // save scraped data into file
            let fileName = "./records/page_" + page_current + ".json";
            async function save_file() {
                fs.writeFile(fileName, JSON.stringify(allScrapedData), 'utf8', function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Page " + page_current + " ** scraped data successfully saved. View it at " + fileName);
                });
                return true;
            }
            await save_file();
            // Update page counters
            // page_counter = 0;

            // exit if the last page is reached
            if ( page_current == page_last ) {
console.log('----- Page ' + page_current + ' scraped ! -----');
console.log( '' );
console.log( '' );
                // console.log( allScrapedData );
                // return allScrapedData; 
                
                return true;      // The exit
            }

            await scrapeCurrentPage();

        }

// console.log( 'rep++++' );
// console.log( allScrapedData );
        await scrapeCurrentPage();
        return allScrapedData; // 
    }
}
export { scrapeData };