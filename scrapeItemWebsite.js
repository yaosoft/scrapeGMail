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
await itemPage.setRequestInterception(true)
await itemPage.on('request', (req) => {
  if (
    req.resourceType() === 'image' ||
    req.resourceType() == 'stylesheet' ||
    req.resourceType() == 'font'
  ) {
    req.abort();
  }
  else {
    req.continue();
  }
});

await itemPage.setViewport({
    width: 1366,
    height: 768,
    //deviceScaleFactor: 1,
    //hasTouch: false,
    isLandscape: true,
    //isMobile: false,
});

const link = inputData.website;
// const ID = inputData.ID;

// read the file content from itemHTMLFile
const getData = async () => {
    // 
    var dataObj = {};
    // Get Item page HTML page url

    var itemPromise = () => new Promise(async (resolve, reject) => {
        // Load html page

        // await itemPage.setRequestInterception(true)
        // await itemPage.on('request', (req) => {
        //     if (
        //         req.resourceType() === 'image' ||
        //         req.resourceType() == 'stylesheet' ||
        //         req.resourceType() == 'font'
        //     ) {
        //         req.abort();
        //     }
        //     else {
        //         req.continue();
        //     }
        // });

        // set page's browser client
        const agents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"];
        // import randomUseragent from 'random-useragent';
        // set request interception
        var randomAgents = agents[Math.floor(Math.random() * agents.length)];
        // const randomAgents = randomUseragent.getRandom(); // gets a random user agent string
        await itemPage.setUserAgent(randomAgents);

        // autoscroll
        async function autoScroll() {
            await itemPage.evaluate(async () => {
                    await new Promise( async(resolve) => {
                        var totalHeight = 0;
                        var distance = 200;
                        var timer = setInterval( async() => {
                            var scrollHeight = document.body.scrollHeight;
                            await window.scrollBy(0, distance);
                            totalHeight += distance;

                            if (totalHeight >= scrollHeight - window.innerHeight) {
                                await clearInterval(timer);
                                resolve();
                            }
                        }, 100);
                    });
            });
        }
        
        // Open the item page
        var count = 0;
        const gotoUrl = async() => {
            try {
                await itemPage.goto(link, {timeout: 30000});
            }
            catch(err){
                // console.log( 'URL not found!' );
                if( count < 10 ){
                    randomAgents = agents[Math.floor(Math.random() * agents.length)];
                    await itemPage.setUserAgent(randomAgents);
                    count ++;
                    await gotoUrl();
                }
                else{
                    console.log( '10 tentative sans success, ' + link );
                    resolve(dataObj); 
                    return true;
                }
            }
        }

        gotoUrl();
        
        
        const addressX = "//div[@data-stid= 'content-hotel-address']";
        var sep = '^^^';
        // try Address selector
        try {
            await itemPage.waitForXPath(addressX, {timeout:10000});
        }
        catch(err){
            // console.log( '(!) addressX not foundX' )
        }

        
        try {
            var allItems = '';
            var licount = '';
            var elem   = '';
            
            // const toWaitSelector = "//h4[contains(., 'Disclaimer')]";
            // await itemPage.waitForXPath(toWaitSelector, {timeout:120000});

            // Name
            const nameX = "//h1[contains(@class, 'uitk-heading')]";
            var name = '';
            try {
                await itemPage.waitForXPath( nameX, {timeout:6000} );
                const elts = await itemPage.$x(nameX);
                name = await itemPage.evaluate(elt => elt.textContent, elts[0]);
                dataObj[ 'Name' ] = name;
            }
            catch (err) {
//              console.log('Name error: ' + err.message );
                name = '';
            }
            
            // Note
            const noteX = "//h1[contains(@class, 'uitk-heading')]//ancestor::div[2]/following-sibling::div/div/div/div/div/div/div/span/div";
            var note = '';
            try {
                await itemPage.waitForXPath( noteX, { timeout:6000 } );
                const elts = await itemPage.$x( noteX );
                const notestring = await itemPage.evaluate( elt => elt.textContent, elts[0] );
                note = notestring.split( ' ' )[0].trim();
                dataObj[ 'Note' ] = note;
            }
            catch (err) {
//              console.log('Name error: ' + err.message );
                note = '';
            }

            // Address
            const addressX = "//div[@data-stid= 'content-hotel-address']";
            var address = '';
            try {
                // await itemPage.waitForXPath( addressX, {timeout:10000} );
                const elts = await itemPage.$x(addressX);
                address = await itemPage.evaluate(elt => elt.textContent, elts[0]);
            }
            catch (err) {
                console.log('Address error: ' + err.message );
                address = '';
            }

           // Ville: we want to rclude  alrady scraped Villes ( already scraped )
            var ville = '';
            dataObj[ 'Skip' ]  = 0;
            dataObj[ 'Ville' ]  = '';
            try {
                const address_tab = address.split( ',' );
                const ln = address_tab.length;
                
                // Guess the Ville from address
                const street = [ 'avenue', 'rue', 'champs', 'allee', 'route'];
                var i = 0;
                for( var address_part in address_tab ){
                    if( street.includes( address_part.trim() ) ){
                        ville = address_tab[ i + 1 ].trim();
                    }
                    i++;
                }
                if( !ville ){
                    if( ln == 3 || ln == 4 )
                        ville = address_tab[1].trim();
                    else
                        ville = address_tab[ ln - 3 ].trim();
                }
                    
// console.log('Ville: ' + ville );
                // Skip some Villes
                const liste_villes = [ 
                    'Montpellier',
                    'Aix-en-Provence',
                    'Arcachon',
                    'Cannes',
                    'Deauville',
                    'La Rochelle',
                    'Lyon',
                    'Nantes',
                    'Paris',
                ];
                
                //if( liste_villes.includes(ville) ){
                //    dataObj[ 'Skip' ] = 1;
                //    dataObj[ 'Ville' ] = ville;
                //    resolve(dataObj); 
                //    return true;
                //}
            }
            catch (err) {
              console.log('Ville error: ' + err.message );
                ville = '';
            }
            
////
            await autoScroll();
             
            // wait for photos
            const imagesX = "//div[@id = 'Overview']//img[contains( @class, 'uitk-image-media' )]";
            try{
                await itemPage.waitForXPath(imagesX, {timeout:10000});
            }
            catch( err ){
            // console.log( 'imagesX error: ' + err.message );
            }
////
            // Stars
            const starsX = "//div[contains(@class, 'uitk-rating')]/span";
            var stars = '';
            try {
                await itemPage.waitForXPath(starsX, {timeout:6000});
                const elts = await itemPage.$x(starsX);
                const stars_text = await itemPage.evaluate(elt => elt.textContent, elts[0]);
                stars = stars_text.replace(/^\D+/g, '');
            }
            catch (err) {
//              console.log('Stars');
                dataObj['Stars'] = '';
            }

            // Description
            const descriptionX = "//div[contains(@class, 'uitk-rating')]//following-sibling::div";
            var description = '';
            try {
                await itemPage.waitForXPath(descriptionX, {timeout:6000});
                const elts = await itemPage.$x(descriptionX);
                description = await itemPage.evaluate(elt => elt.textContent, elts[0]);
            }
            catch (err) {
//              console.log('Description error: ' + err.message);
                dataObj['Description'] = '';
            }

            // Équipements populaires
            const popUpBtnX = "//span[ contains(text(), 'Tout afficher') ]";
            const populaireX = "//section[contains(@class,'uitk-centered-sheet')]//div[3]/div/div/div/div/ul//span";
            var equipementsPopulaire = '';

            try{
                await itemPage.waitForXPath(popUpBtnX, {timeout:6000});
                const elts = await itemPage.$x( popUpBtnX );
                await itemPage.evaluate( elt => elt.click(), elts[0] ); // open the pop up

                await itemPage.waitForXPath(populaireX, {timeout:10000});
                allItems = await itemPage.$x(populaireX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                            sep = '';
                    equipementsPopulaire += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
                const popUpCloseBtnX = "//section[contains(@class,'uitk-centered-sheet')]//div[2]/button";
                const elt = await itemPage.$x( popUpCloseBtnX );   // close the pop up
                await itemPage.evaluate( elt => elt.click(), elt[0] ); 
            }
            catch (err) {
//                console.log('EquipementsPopulaire error ' + err.message);
                dataObj['EquipementsPopulaire'] = '';
            }
            
            // Installations
            const installationX = "//h3[contains(., 'Installation')]/../../following-sibling::ul/li/div";
            var installation = '';
            try{
                await itemPage.waitForXPath(installationX, {timeout:6000});
                allItems = await itemPage.$x(installationX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                            sep = '';
                    installation += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Installation error ' + err.message);
                dataObj['Installation'] = '';
            }

            // Restauration
            const restaurationX = "//h3[contains(., 'Restauration')]/../../following-sibling::ul/li/div";
            var restauration = '';
            try{
                await itemPage.waitForXPath(restaurationX, {timeout:6000});
                allItems = await itemPage.$x(restaurationX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    restauration += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Restauration error ' + err.message);
                dataObj['Restauration'] = '';
            }
            
            // Que faire
            const distractionX = "//h3[contains(., 'Que faire')]/../../following-sibling::ul/li/div";
            var distraction = '';
            try{
                await itemPage.waitForXPath(distractionX, {timeout:6000});
                allItems = await itemPage.$x(restaurationX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    distraction += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Distraction error ' + err.message);
                dataObj['Distraction'] = '';
            }

            // Voyage avec les enfants
            const enfantsX = "//h3[contains(., 'Voyage avec les enfants')]/../../following-sibling::ul/li/div";
            var enfants = '';
            try{
                await itemPage.waitForXPath(enfantsX, {timeout:6000});
                allItems = await itemPage.$x(enfantsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    enfants += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Enfants error ' + err.message);
                dataObj['Enfants'] = '';
            }

            // Services
            const servicesX = "//h3[contains(., 'Services')]/../../following-sibling::ul/li/div";
            var services = '';
            try{
                await itemPage.waitForXPath(servicesX, {timeout:6000});
                allItems = await itemPage.$x(servicesX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    services += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Services error ' + err.message);
                dataObj['Services'] = '';
            }

            // Affaires
            const affairesX = "//h3[contains(., 'Affaires')]/../../following-sibling::ul/li/div";
            var affaires = '';
            try{
                await itemPage.waitForXPath(affairesX, {timeout:6000});
                allItems = await itemPage.$x(affairesX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    affaires += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Services error ' + err.message);
                dataObj['Affaires'] = '';
            }

            // Accessibility
            const accessibilityX = "//h3[contains(., 'Services')]/../../following-sibling::ul/li/div";
            var accessibility = '';
            try{
                await itemPage.waitForXPath(accessibilityX, {timeout:6000});
                allItems = await itemPage.$x(accessibilityX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    accessibility += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Accessibility error ' + err.message);
                dataObj['Accessibility'] = '';
            }
            
            /////
            
            // A proximité
            const proximiteX = "//h4[contains(text(), 'À proximité')]/following-sibling::ul/li/div";
            var proximite = '';
            try{
                await itemPage.waitForXPath(proximiteX, {timeout:6000});
                allItems = await itemPage.$x(proximiteX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    proximite += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Proximite error ' + err.message);
                dataObj['Proximite'] = '';
            }
            
            // Restaurants à proximite
            const proximiteRestaurantsX = "//h4[contains(text(), 'Restaurants')]/following-sibling::ul/li/div";
            var proximiteRestaurants = '';
            try{
                await itemPage.waitForXPath(proximiteRestaurantsX, {timeout:6000});
                allItems = await itemPage.$x(proximiteRestaurantsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    proximiteRestaurants += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Proximite error ' + err.message);
                dataObj['Proximite_restaurants'] = '';
            }
            
            // Comment se deplacer
            const deplacementX = "//h4[contains(text(), 'Comment se déplacer')]/following-sibling::ul/li/div";
            var deplacement = '';
            try{
                await itemPage.waitForXPath(deplacementX, {timeout:6000});
                allItems = await itemPage.$x(deplacementX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    deplacement += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Deplacement error ' + err.message);
                dataObj['Deplacement'] = '';
            }
            
            // A propos
            const aproposX = "//h2[contains(text(), 'À propos de cet hébergement')]//ancestor::div[4]//following-sibling::div/div/div/div/following-sibling::div";
            var aPropos = '';
            try {
                await itemPage.waitForXPath(aproposX, {timeout:6000});
                const elts = await itemPage.$x(aproposX);
                aPropos = await itemPage.evaluate(elt => elt.textContent, elts[0]);
            }
            catch (err) {
//              console.log('A propos error ' + err.message);
                dataObj['A_propos'] = '';
            }

            // A propos - langues
            const aproposLanguesX = "//h2[contains(text(), 'À propos de cet hébergement')]//ancestor::div[4]//following-sibling::div[2]/div/div/div//following-sibling::div/div/div/div";
            var aProposLangues = '';
            try {
                await itemPage.waitForXPath(aproposLanguesX, {timeout:6000});
                const elts = await itemPage.$x(aproposLanguesX);
                aProposLangues = await itemPage.evaluate(elt => elt.textContent, elts[0]);
            }
            catch (err) {
//              console.log('A propos error ' + err.message);
                dataObj['Langues'] = '';
            }

            // Taille
            const tailleX = "//h3[contains(., 'Taille de l')]/../../following-sibling::ul/li/div";
            var taille = '';
            try{
                await itemPage.waitForXPath(tailleX, {timeout:6000});
                allItems = await itemPage.$x(tailleX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    taille += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('taille error ' + err.message);
                dataObj['Taille'] = '';
            }
            
            // Arrivée et départ
            const arriveeX = "//h3[contains(., 'Arrivée et départ')]/../../following-sibling::ul/li/div";
            var arrivee = '';
            try{
                await itemPage.waitForXPath(arriveeX, {timeout:6000});
                allItems = await itemPage.$x(arriveeX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    arrivee += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Arrivee error ' + err.message);
                dataObj['Arrivee'] = '';
            }
            
            // Restrictions
            const restrictionsX = "//h3[contains(., 'Restrictions liées à votre voyage')]/../../following-sibling::ul/li/div";
            var restrictions = '';
            try{
                await itemPage.waitForXPath(restrictionsX, {timeout:6000});
                allItems = await itemPage.$x(restrictionsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    restrictions += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Restrictions error ' + err.message);
                dataObj['Restrictions'] = '';
            }
            
            // Instructions spéciales d’arrivée
            const instructionsX = "//h3[contains(., 'Instructions spéciales d')]/../../following-sibling::ul/li/div";
            var instructions = '';
            try{
                await itemPage.waitForXPath(instructionsX, {timeout:6000});
                allItems = await itemPage.$x(instructionsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    instructions += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Instructions error ' + err.message);
                dataObj['Instructions'] = '';
            }

            // Obligatoire à l’arrivée
            const obligatoireX = "//h3[contains(., 'Obligatoire à l’arrivée')]/../../following-sibling::ul/li/div";
            var obligatoire = '';
            try{
                await itemPage.waitForXPath(obligatoireX, {timeout:6000});
                allItems = await itemPage.$x(obligatoireX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    obligatoire += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Obligatoire error ' + err.message);
                dataObj['Obligatoire'] = '';
            }

            // Animaux de compagnie
            const animauxX = "//h3[contains(., 'Animaux de compagnie')]/../../following-sibling::ul/li/div";
            var animaux = '';
            try{
                await itemPage.waitForXPath(animauxX, {timeout:6000});
                allItems = await itemPage.$x(animauxX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    animaux += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Animaux error ' + err.message);
                dataObj['Animaux'] = '';
            }

            // Internet
            const internetX = "//h3[contains(., 'Internet')]/../../following-sibling::ul/li/div";
            var internet = '';
            try{
                await itemPage.waitForXPath(internetX, {timeout:6000});
                allItems = await itemPage.$x(internetX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    internet += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Internet error ' + err.message);
                dataObj['Internet'] = '';
            }

            // Parking
            const parkingX = "//h3[contains(., 'Parking')]/../../following-sibling::ul/li/div";
            var parking = '';
            try{
                await itemPage.waitForXPath(parkingX, {timeout:6000});
                allItems = await itemPage.$x(parkingX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    parking += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Parking error ' + err.message);
                dataObj['Parking'] = '';
            }
            
            // Autres informations
            const AutresInformationsX = "//h3[contains(., 'Autres informations')]/../../following-sibling::ul/li/div";
            var autresInformations = '';
            try{
                await itemPage.waitForXPath(AutresInformationsX, {timeout:6000});
                allItems = await itemPage.$x(AutresInformationsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    autresInformations += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Autres informations error ' + err.message);
                dataObj['AutresInformations'] = '';
            }
            
            // Spa
            const spaX = "//h3[contains(., 'Spa')]/../../../following-sibling::div/div/div/div/div";
            var spa = '';
            try{
                await itemPage.waitForXPath(spaX, {timeout:6000});
                allItems = await itemPage.$x(spaX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    spa += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Spa error ' + err.message);
                dataObj['Spa'] = '';
            }
            
            // Récompenses et affiliations
            const recompensesX = "//h3[contains(., 'Récompenses et affiliations')]/../../../following-sibling::div/div/div/div";
            var recompenses = '';
            try{
                await itemPage.waitForXPath(recompensesX, {timeout:6000});
                allItems = await itemPage.$x(recompensesX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    recompenses += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Récompenses error ' + err.message);
                dataObj['Recompenses'] = '';
            }
            
            // Cautions remboursables
            const cautionsX = "//h3[contains(., 'Cautions remboursables')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var cautions = '';
            try{
                await itemPage.waitForXPath(cautionsX, {timeout:6000});
                allItems = await itemPage.$x(cautionsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    cautions += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Cautions error ' + err.message);
                dataObj['Cautions'] = '';
            }
            
            // Options en supplément
            const optionsX = "//h3[contains(., 'Options en supplément')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var fraisOptions = '';
            try{
                await itemPage.waitForXPath(optionsX, {timeout:6000});
                allItems = await itemPage.$x(optionsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisOptions += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Options en supplément error ' + err.message);
                dataObj['Frais_options'] = '';
            }
            
            // Renovations_fermetures
            const renovationsFermeturesX = "//h3[contains(., 'Rénovations et fermetures')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var renovationsFermetures = '';
            try{
                await itemPage.waitForXPath(renovationsFermeturesX, {timeout:6000});
                allItems = await itemPage.$x(renovationsFermeturesX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    renovationsFermetures += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Renovations et fermetures ' + err.message);
                dataObj['Renovations_fermetures'] = '';
            }
            
            // Frais obligatoires
            const obligatoiresX = "//h3[contains(., 'Frais obligatoires')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var fraisObligatoires = '';
            try{
                await itemPage.waitForXPath(obligatoiresX, {timeout:6000});
                allItems = await itemPage.$x(obligatoiresX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisObligatoires += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Frais_obligatoires error ' + err.message);
                dataObj['Frais_obligatoires'] = '';
            }
            
            // Frais - Enfants et lits supplémentaires
            const fraisEnfantsX = "//h3[contains(., 'Enfants et lits supplémentaires')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var fraisEnfants = '';
            try{
                await itemPage.waitForXPath(fraisEnfantsX, {timeout:6000});
                allItems = await itemPage.$x(fraisEnfantsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisEnfants += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Frais_enfants error ' + err.message);
                dataObj['Frais_enfants'] = '';
            }
            
            // Frais - Animaux domestiques
            const animauxDomestiquesX = "//h3[contains(., 'Animaux domestiques')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var fraisAnimaux = '';
            try{
                await itemPage.waitForXPath(animauxDomestiquesX, {timeout:6000});
                allItems = await itemPage.$x(animauxDomestiquesX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisAnimaux += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Frais_animaux error ' + err.message);
                dataObj['Frais_animaux'] = '';
            }
            
            // Frais - Parking
            const fraisParkingX = "//h3[contains(., 'Parking')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var fraisParking = '';
            try{
                await itemPage.waitForXPath(fraisParkingX, {timeout:6000});
                allItems = await itemPage.$x(fraisParkingX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisParking += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Frais_parking error ' + err.message);
                dataObj['Frais_parking'] = '';
            }
            
            // Frais - Piscine, spa et centre de fitness
            const fraisPiscineX = "//h3[contains(., 'Piscine, spa et centre de fitness')]/../../../following-sibling::div//ul/li/span/following-sibling::span";
            var fraisPiscine = '';
            try{
                await itemPage.waitForXPath(fraisPiscineX, {timeout:6000});
                allItems = await itemPage.$x(fraisPiscineX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisPiscine += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Frais_piscine error ' + err.message);
                dataObj['Frais_piscine'] = '';
            }
            
            // Frais - Nettoyage et désinfection
            const fraisNettoyageX = "//h3[contains(., 'Nettoyage et désinfection')]/../../../following-sibling::div//p";
            var fraisNettoyage = '';
            try{
                await itemPage.waitForXPath(fraisNettoyageX, {timeout:6000});
                allItems = await itemPage.$x(fraisNettoyageX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    fraisNettoyage += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Frais_nettoyage error ' + err.message);
                dataObj['Frais_nettoyage'] = '';
            }
            
            // Prestations particulières
            const prestationsParticulieresX = "//h2[contains(.,'Prestations particulières')]//ancestor::div[4]//following-sibling::div/div/div/div/following-sibling::div/div";
            var prestationsParticulieres = '';
            try{
                await itemPage.waitForXPath(prestationsParticulieresX, {timeout:6000});
                allItems = await itemPage.$x(prestationsParticulieresX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    prestationsParticulieres += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Prestations particulières error ' + err.message);
                dataObj['Prestations_particulieres'] = '';
            }
            
            // Conditions
            const conditionsX = "//h3[contains(., 'Conditions')]/../../../following-sibling::div/div//div";
            var conditions = '';
            try{
                await itemPage.waitForXPath(conditionsX, {timeout:6000});
                allItems = await itemPage.$x(conditionsX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    conditions += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('Conditions error ' + err.message);
                dataObj['Conditions'] = '';
            }
            
            // Connu aussi sous le nom de
            const autreNomX = "//h3[contains(., 'Connu aussi sous le nom de')]/../../../following-sibling::div/div/div";
            var autreNoms = '';
            try{
                await itemPage.waitForXPath(autreNomX, {timeout:6000});
                allItems = await itemPage.$x(autreNomX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                var sep = '^^^'; // separator
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    autreNoms += await itemPage.evaluate( elt => elt.textContent, allItems[i] ) + sep;
                }
            }
            catch (err) {
//              console.log('AutreNoms error ' + err.message);
                dataObj['AutreNoms'] = '';
            }

            // Images
            // const imagesX = "//div[@id = 'Overview']//img[contains( @class, 'uitk-image-media' )]";
            var images = '';
            var sep = '^^^'; // separator

            try{
                await itemPage.waitForXPath(imagesX, {timeout:6000});
                allItems = await itemPage.$x(imagesX);
                licount = await itemPage.evaluate(allItems => allItems.length, allItems);
                for( var i = 0; i < licount; i++ ){
                    if( i == licount - 1 )
                        sep = '';
                    images += await itemPage.evaluate( elt => elt.src, allItems[i] ) + sep;
                }
            }
            catch (err) {
// console.log('ImagesSrc error ' + err.message);
                dataObj['Photo_links'] = '';
            }
            
            
            // collect
            dataObj['Nom']                  = name;
            dataObj['Adresse']              = address;
            dataObj['Note']                 = note;
            dataObj['Etoiles']              = stars;
            dataObj['Ville']                = ville;
            dataObj['Description']          = description;
            dataObj['EquipementsPopulaire'] = equipementsPopulaire;
            dataObj['Installation']         = installation;
            dataObj['Restauration']         = restauration;
            dataObj['Distraction']          = distraction;
            dataObj['Enfants']              = enfants;
            dataObj['Services']             = services;
            dataObj['Affaires']             = affaires;
            dataObj['Accessibility']        = accessibility;
            dataObj['Proximite']            = proximite;
            dataObj['Proximite_restaurants'] = proximiteRestaurants;
            dataObj['Deplacement']          = deplacement;
            dataObj['A_propos']             = aPropos;
            dataObj['Langues']              = aProposLangues;
            dataObj['Taille']               = taille;
            dataObj['Arrivee']              = arrivee;
            dataObj['Restrictions']         = restrictions;
            dataObj['Instructions']         = instructions;
            dataObj['Obligatoire']          = obligatoire;
            dataObj['Animaux']              = animaux;
            dataObj['Internet']             = internet;
            dataObj['Parking']              = parking;
            dataObj['AutresInformations']   = autresInformations;
            dataObj['Spa']                  = spa;
            dataObj['Recompenses']          = recompenses;
            dataObj['Cautions']             = cautions;
            dataObj['Frais_obligatoires']   = fraisObligatoires;
            dataObj['Frais_options']        = fraisOptions;
            dataObj['Frais_enfants']        = fraisEnfants;
            dataObj['Frais_animaux']        = fraisAnimaux;
            dataObj['Frais_parking']        = fraisParking;
            dataObj['Frais_piscine']        = fraisPiscine;
            dataObj['Frais_nettoyage']      = fraisNettoyage;
            dataObj['Renovations_fermetures'] = renovationsFermetures;
            dataObj['Prestations_particulieres']  = prestationsParticulieres;
            dataObj['Conditions']           = conditions;
            dataObj['AutreNoms']            = autreNoms;
            dataObj['Photo_links']          = images;
        }
        catch (err) {
            console.log( err );
        }
        finally {
            resolve(dataObj);
        }
    });

    //const toReturn = await itemPromise();
    const toReturn = await itemPromise();
    // await browser.close;
    return toReturn;

}
const outputData = await getData();

await itemPage.close();
await browser.close();

console.log(JSON.stringify(outputData))  // print out data to STDOUT
