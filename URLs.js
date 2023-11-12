import { locations } from './locations/us_states.js';
const links = {
    async getURLs ( subject ) {
        // const suject = 'Biocoop';
        const URLS = [];
        for( const location of locations ){
            const obj = {};
            obj[ 'location' ]   = location;
            //obj[ 'link' ]       = "https://www.google.com/search?tbs=lrf:!1m4!1u3!2m2!3m1!1e1!2m1!1e3!3sIAE,lf:1,lf_ui:4&tbm=lcl&sxsrf=AB5stBj3yXlkJFOlOChhlQAoylIFBZsS3g:1688349173751&q="+location+"+"+subject+"&rflfq=1&num=10&sa=X&ved=2ahUKEwjAhojmtvH_AhWSP-wKHaORD6IQjGp6BAgaEAE&rlst=f#rlfi=hd:;si:;mv:[[45.046663599999995,4.8455688],[42.333014,-0.32717609999999997]];tbs:lrf:!1m4!1u3!2m2!3m1!1e1!2m1!1e3!3sIAE,lf:1,lf_ui:4",
            obj[ 'link' ]       = "https://www.google.com/search?q=" + location + "+" + subject +"&tbm=lcl&sxsrf=AB5stBjgE_g8Xe7PwKE517-p-323aqCl0g%3A1689995384445&ei=eEi7ZPnpGtKF9u8PlKii-A4&ved=0ahUKEwj5hb-0q6GAAxXSgv0HHRSUCO8Q4dUDCAk";
            
            URLS.push( obj );
        }
        return URLS;
    }
}
export { links };





