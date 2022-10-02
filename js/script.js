const BASURL = "data/";
let lokacija = window.location.pathname;;
lokacija = lokacija.split("/");
lokacija = lokacija[lokacija.length - 1];
console.log(lokacija);

var regExMeil = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var regExPhone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
var regExName = /^[A-Z][a-z]{2,12}$/;
var regExPass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; //Najmanje osam znakova, najmanje jedno slovo i jedan broj

window.onload = function(){


    //Na svim stranama nam je potreban gornji i donji nav meni
    ajaxCallBack(`${BASURL}menu.json`, "GET", function(odg){
        ispisiMenije(odg);
    });

    //Ispis na svakoj stranici -> drustvene mreze
    ispisiDrustvene();

    //Ispis na svakoj stranici -> radno vreme i brzi linkovi
    ispisiRadniDaniBrziLinkovi();

    //Ispis na svakoj stranici -> najnovijih tviter objava
    ispisNajTvit();

    //Na svakoj stranici pitamo za broj elemenata u korpi
    if(getLS("korpaLS") == null || getLS("korpaLS") == 0 )
        document.querySelector(".brojElemenataKorpe").innerHTML = 0;
    else
        brojProizUKorpi();


    //Kada se nalazimo na strani za knjige
    if(lokacija == "books-media-list-view.html"){
        ajaxCallBack(`${BASURL}genre.json`, "GET", function(odg){
            ispisiKategorije(odg);

            //Ako nam budu zatrebale  za kasnije, stavaljmo ih u LS
            setLS("kategorijeLS", odg);
        });

        ajaxCallBack(`${BASURL}/writer.json`, "GET", function(odg){
            ispisiPisce(odg);

            // Ako nam budu zatrebli za kansije, ls
            setLS("pisciLS", odg);
        });

        ajaxCallBack(`${BASURL}book.json`, "GET", function(odg){
            ispisiKnjige(odg);

            setLS("knjigeLS", odg);
        });

        //Bocni ispis najprodavanih knjiga
        ispisNajprodavanjih();

        $(document).on("click", ".cat", function(){
            logika();
        });

        $(document).on("click", ".pis", function(){
            logika();
        });

        $(document).on("click", ".stanje", function(){
            logika();
        });

        $(document).on("change", "#tipSortiranja", function(){
            logika();
        });

        $(document).on("click", ".dugmeZaKorpu", function(e){
            e.preventDefault();
            let kliknuto = this.dataset.idknjige;
            dodajUKorpu(kliknuto);

            document.querySelector("#poruka").setAttribute("style", `display: block;`);
            window.scrollTo({top: 0, behavior: 'smooth'});

            setTimeout(function(){
                document.querySelector("#poruka").setAttribute("style", `display: none;`);
            }, 2500);
        });
    }


    //Kada se nalazimo na strani za newsEvent
    if(lokacija == "news-events-list-view.html"){
        ajaxCallBack(`${BASURL}event.json`, "GET", function(odg){
            ispisiEvent(odg);
            ispisiNajEvent(odg);

            document.querySelector("#pretragaEventa").addEventListener("keyup", function(){
                let vred = this.value.toLowerCase();
                let pretraga = odg.filter((el) => {
                    if(el.lokacija.grad.toLowerCase().indexOf(vred) != -1 || el.lokacija.drzava.toLowerCase().indexOf(vred) != -1 || el.naslov.toLowerCase().indexOf(vred) != -1 || el.sadrzaj.toLowerCase().indexOf(vred) != -1)
                        return true;
                });
                ispisiEvent(pretraga);
            });
        });

    }

    //Kada se nalazimo na strani za blog
    if(lokacija == "blog.html"){
        ajaxCallBack(`${BASURL}blog.json`, "GET", function(odg){
            ispisiBlog(odg);
        });
    }

    if(lokacija == "cart.html"){
        ispisiKorpu();

        $(document).on("click", ".dugmeZaDodaj", function(){
            let kliknuto = this.dataset.idknjige;
            dodajKolicinu(kliknuto);
        });

        $(document).on("click", ".dugmeZaObrisi", function(){
            let kliknuto = this.dataset.idknjige;
            obrisiIzKorpe(kliknuto);
        });

        $(document).on("click", ".dugmeZaOduzmi", function(){
            let kliknuto = this.dataset.idknjige;
            oduzmiIzKorpe(kliknuto);
        });

        $(document).on("click", "#krajKup", function(){
            deleteLS("korpaLS");
        })
    }
    
    //Kada smo na pocetnoj strani imamo potrebu za regEx za mejl
    if(lokacija == "index.html"){
        proveriPolje("#newsletter", regExMeil, "#porukaEmail");
        
        //Konacna provera pre slanja
        document.querySelector("#sendNewsletter").addEventListener("click", function(){
            let uneto = document.querySelector("#newsletter").value;
            if(testiraj(uneto ,regExMeil)){
                document.querySelector("#newsletter").nextElementSibling.setAttribute("style", `display: none;`);
                brisiVredPolja("#newsletter");
                dodajInfo("#uspesnoSlanje");
                setTimeout(ocistiGresku, 3000, "#uspesnoSlanje");
                
            }
            else{
                document.querySelector("#newsletter").nextElementSibling.setAttribute("style", `display: block;`);
                setTimeout(ocistiGresku, 3000, "#porukaEmail");
            }
        });
    }

    //Kada smo na contact strani
    if(lokacija == "contact.html"){
        //Blur provera za kontak formu
        
        //Za ime i prezime
        proveriPolje("#first-name", regExName, "#ImePoruka");
        proveriPolje("#last-name", regExName, "#PrezimePoruka");

        //Za meil i broj
        proveriPolje("#email", regExMeil, "#porukaEmail");
        proveriPolje("#phone", regExPhone, "#porukaMobilni");

        //Za ddl
        proveriDDL("#zanimanjeDDL", "#porukaDDL");
        $('input[type=radio][name=pol]').on("change", function(){
            proveriRadio("pol", "#porukaPol");
        })

        //Za textArea
        proveriTextArea("#message", "#porukaMessage");

        //Kompletna provera
        document.querySelector("#submit-contact-form").addEventListener("click", function(){
            let nizG = [];
            if( !testiraj(uzmiVredPolja("#first-name"), regExName) ){
                nizG.push("Greska Ime");
                dodajGresku("#ImePoruka");
            }
            
            if( !testiraj(uzmiVredPolja("#last-name"), regExName) ){
                nizG.push("Greska Prezime");
                dodajGresku("#PrezimePoruka");
            }

            if( !testiraj(uzmiVredPolja("#email"), regExMeil) ){
                nizG.push("Greska Meil");
                dodajGresku("#porukaEmail");
            }

            if( !testiraj(uzmiVredPolja("#phone"), regExPhone) ){
                nizG.push("Greska Mobilni");
                dodajGresku("#porukaMobilni");
            }

            if(document.querySelector("#zanimanjeDDL").value == "0"){
                nizG.push("Greska obrazovanje");
                dodajGresku("#porukaDDL");
            }

            if(proveriRadio("pol", "#porukaPol") == 0){
                nizG.push("Greska Pol");
                dodajGresku("#porukaPol");
            }

            if(document.querySelector("#message").value.length < 12){
                nizG.push("Greska Poruka");
                dodajGresku("#porukaMessage");
            }

            if(nizG.length == 0){
                dodajInfo("#uspesnoSlanje");
                brisiVredPolja("#first-name");
                brisiVredPolja("#last-name");
                brisiVredPolja("#email");
                brisiVredPolja("#phone");
                brisiVredPolja("#message");

                setTimeout(ocistiGresku, 3000, "#uspesnoSlanje");
                setTimeout(osvezi, 2000);
            }            
        });

    }

    //Kada smo na singin strani
    if(lokacija == "signin.html"){
        //Blur provera za napravi nalog

        proveriPolje("#email2", regExMeil, "#porukaEmail2");
        proveriPolje("#pass2", regExPass, "#porukaPass2");

        //Dodatna provera za confirmpass
        document.querySelector("#pass3").addEventListener("blur", function(){
            let uneto = this.value;
            let passPre = document.querySelector("#pass2").value;
                if(testiraj(uneto, regExPass) && uneto == passPre){
                document.querySelector("#pass3").nextElementSibling.setAttribute("style", `display: none;`);
            }
            else{
                document.querySelector("#pass3").nextElementSibling.setAttribute("style", `display: block;`);
                setTimeout(ocistiGresku, 3000, "#porukaPass3");
            }
        });

        //Kompltna provera prijava
        document.querySelector("#napraviNalog").addEventListener("click", function(){
            let nizG = [];

            if( !testiraj(uzmiVredPolja("#email2"), regExMeil) ){
                nizG.push("Greska Meil");
                dodajGresku("#porukaEmail2");
            }

            if( !testiraj(uzmiVredPolja("#pass2"), regExPass) ){
                nizG.push("Greska Pass");
                dodajGresku("#porukaPass2");
            }

            if( !testiraj(uzmiVredPolja("#pass3"), regExPass) || uzmiVredPolja("#pass2") != uzmiVredPolja("#pass3")){
                nizG.push("Greska Pass potvrda");
                dodajGresku("#porukaPass3");
            }

            if(nizG.length == 0){
                dodajInfo("#uspesnoSlanje2");
                brisiVredPolja("#email2");
                brisiVredPolja("#pass2");
                brisiVredPolja("#pass3");

                setTimeout(ocistiGresku, 3900, "#uspesnoSlanje2");
                setTimeout(osvezi, 2000);
            }
        });


        //Blur Provera za logovanje
        proveriPolje("#email", regExMeil, "#porukaEmail");
        proveriPolje("#pass", regExPass, "#porukaPass");

        //Kompltna provera za prijavu
        document.querySelector("#prijaviSe").addEventListener("click", function(){
            let nizG = [];

            if( !testiraj(uzmiVredPolja("#email"), regExMeil) ){
                nizG.push("Greska Meil");
                dodajGresku("#porukaEmail");
            }

            if( !testiraj(uzmiVredPolja("#pass"), regExPass) ){
                nizG.push("Greska Pass");
                dodajGresku("#porukaPass");
            }

            if(nizG.length == 0){
                dodajInfo("#uspesnoSlanje3");
                brisiVredPolja("#email");
                brisiVredPolja("#pass");

                setTimeout(ocistiGresku, 3900, "#uspesnoSlanje3");
                setTimeout(osvezi, 2000);
            }
        });

        
    }

}

// ajaxCallBack f-ja
function ajaxCallBack(url, method, result){
    $.ajax({
        url: url,
        method: method,
        dataType: "JSON",
        success: result,
        error: function(xhr){
            console.log(xhr);
        }
    });
}

// F-ja(void) za unos u LocalStorage
function setLS(kljuc, vrednost){
    localStorage.setItem(kljuc, JSON.stringify(vrednost));
}

//F-ja za uzimanje iz LocalStorage-a
function getLS(kljuc){
    return JSON.parse(localStorage.getItem(kljuc));
}

//deleteLS void
function deleteLS(kljuc){
    localStorage.removeItem(kljuc);
}


//##########################
//F-ja(void) ispis menija
function ispisiMenije(odg){
    let ispis = "";
    let ispis2 = "";
    
    //Ispis menija
    for(let el of odg){
        if(lokacija.includes(el.href)){
            ispis += `<li class="active"><a href="${el.href}">${el.naziv}</a></li>`;
        }
        else{
            ispis += `<li><a href="${el.href}">${el.naziv}</a></li>`;
        }
        ispis2 += `<li><a href="${el.href}">${el.naziv}</a></li>`;
    }
    document.querySelector(".gornjiNav").innerHTML = ispis;
    document.querySelector(".donjiNav").innerHTML = ispis2;
}

//F-ja(void) ispis Drustvenih mreza
function ispisiDrustvene(){
    let nizDrustvenih = [
        {
            naziv: "facebook",
            klasa: "fa fa-facebook-f",
            href: "https://www.facebook.com/"
        },
        {
            naziv: "twitter",
            klasa: "fa fa-twitter",
            href: "https://twitter.com/"
        },
        {
            naziv: "google",
            klasa: "fa fa-google-plus",
            href: "https://www.google.com"
        },
        {
            naziv: "rss",
            klasa: "fa fa-rss",
            href: "rss.xml"
        },
        {
            naziv: "linkedin",
            klasa: "fa fa-linkedin",
            href: "https://www.linkedin.com/"
        },
        {
            naziv: "youtube",
            klasa: "fa fa-youtube",
            href: "https://www.youtube.com/"
        },
    ];

    let ispis = "";
    for(let el of nizDrustvenih){
        ispis += `<li>
                <a class="${el.naziv}" href="${el.href}" target="_blank">
                    <span>
                        <i class="${el.klasa}"></i>
                    </span>
                </a>
            </li>`;
    }

    document.querySelector(".socijalneMreze").innerHTML = ispis;
}

// F-ja(void) ispis brzih linkova i radnog vremena
function ispisiRadniDaniBrziLinkovi(){
    let brziLikovi = [
        {
            naziv: "Library News",
            href: "https://www.libraryjournal.com/section/news"
        },
        {
            naziv: "History of libraries",
            href: "https://www.britannica.com/topic/library/The-history-of-libraries"
        },
        {
            naziv: "Poetryfoundation",
            href: "https://www.poetryfoundation.org/poetrymagazine"
        },
    ];

    let radnoVreme = ["Mon - Thu: 9 am - 9 pm", "Fri: 9 am - 6 pm", "Sat: 9 am - 5 pm", "Sun: 1 pm - 6 pm"];

    let ispis = "";
    for(let el of brziLikovi){
        ispis += `<li><a href="${el.href}" target="_blank">${el.naziv}</a></li>`;
    }
    document.querySelector(".brziLinkovi").innerHTML = ispis;

    ispis = "";
    for(let el of radnoVreme){
        ispis += `<p>${el}</p>`;
    }
    document.querySelector(".radnoVreme").innerHTML = ispis;

}

function ispisNajTvit(){
    let niznajT = ["@Libraria is the best bookshop on the world - > Come to see us.", "Exceptional selection of books available on @Libraria"];
    let ispis = "";
    for(let el of niznajT){
        ispis += `<li><p>${el}</p></li>`;
    }
    document.querySelector(".najTviter").innerHTML = ispis;
}
//---------


//##Ispis kategorija i pisaca##
function ispisiKategorije(odg){
    let ispis = "";
    for(let el of odg){
        ispis += `<div class="form-check">
        <input class="form-check-input cat" type="checkbox" name="kate" value="${el.id}" id="${el.naziv}">
        <label class="form-check-label" for="${el.naziv}">
        ${el.naziv}
        </label>`;
    }
    document.querySelector("#kategorije").innerHTML = ispis;
}

function ispisiPisce(odg){
    let ispis = "";
    for(let el of odg){
        ispis += `<div class="form-check">
        <input class="form-check-input pis" type="checkbox" name="pis" value="${el.id}" id="${el.ime}${el.prezime}">
        <label class="form-check-label" for="${el.ime}${el.prezime}">
        ${el.ime} ${el.prezime}
        </label>`;
    }
    document.querySelector("#pisci").innerHTML = ispis;
}

//-----------------

//##Ispis knjiga + dodatna obrada
function ispisiKnjige(knjige){
    let ispis = "";
    if(knjige.length == 0){
        let poruka = `<div class="alert alert-danger" role="alert">
                    There are currently no books for the desired parameters
                    </div>`;
        document.querySelector(".books-list").innerHTML = poruka;
        document.querySelector("#brojPrikaza").innerHTML = 0
    }
    else{
        for(let el of knjige){
            ispis += `<article> 
            <div class="single-book-box">                                                
                <div class="post-thumbnail">
                    <div class="book-list-icon yellow-icon"></div>
                    <a href="#"><img alt="${el.slika.alt}" src="${el.slika.src}"/></a></div>
                <div class="post-detail">
                    <header class="entry-header">
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="entry-title">
                                    <a href="#">${el.naslov}</a>
                                </h3>
                                <ul>
                                    <li><strong>Author:</strong> ${obradaIme(el.idPisac)}</li>
                                    <li><strong>ISBN:</strong> ${el.isbn}</li>
                                </ul>
                            </div>
                            <div class="col-sm-6">
                                <ul>
                                    <li><strong>In stock:</strong> ${obradaDostupnost(el.dostupnost)}</li>
                                    ${obradaCene(el.cena)}
                                    <li><strong>Category:</strong> ${obradaKat(el.idKat)}</li>
                                </ul>                                                                
                            </div>
                        </div>
                    </header>
                    <div class="entry-content">
                        <p>${el.opis}</p>
                    </div>
                    <footer class="entry-footer">
                        ${obradaDostupnostiDugme(el.dostupnost, el.id)}
                    </footer>
                </div>
                <div class="clear"></div>
            </div>
            </article>`;
        }
        document.querySelector(".books-list").innerHTML = ispis;
        document.querySelector("#brojPrikaza").innerHTML = knjige.length;
    }
}

function obradaIme(idP){
    let pisciLS = getLS("pisciLS");
    let uzetiPisac = pisciLS.filter(function(el){
        if(el.id == idP)
            return true;
    });

    if(uzetiPisac[0].srednjeIme)
        return `${uzetiPisac[0].ime} ${uzetiPisac[0].srednjeIme} ${uzetiPisac[0].prezime}`;
    else
        return `${uzetiPisac[0].ime} ${uzetiPisac[0].prezime}`;

}

function obradaDostupnost(stanje){
    if(stanje)
        return "Yes";
    else
        return "No";
}

function obradaCene(cenaObj){
    if(cenaObj.staraCena == null){
        return `<li><strong>New price:</strong>$${cenaObj.aktuelnaCena}</li>`;
    }
    else{
        return ` <li><strong>New price:</strong>$${cenaObj.aktuelnaCena}</li>
                <li><strong>Old price:</strong>
                <del>$${cenaObj.staraCena}</del>
                </li>`;
    }
}

function obradaKat(nizKat){
    let sveKatLS = getLS("kategorijeLS");
    let pogodakKat = [];
    for(let x of nizKat){
        let jednaKat = sveKatLS.filter((el) => {
            if(x == el.id)
                return true;
        });
        pogodakKat.push(jednaKat[0].naziv);
    }

    let ispis = "";

    for(let i = 0; i < pogodakKat.length; i++){
        if(i == pogodakKat.length - 1)
            ispis += `${pogodakKat[i]}`;
        else
            ispis += `${pogodakKat[i]}, `;
    }

    return ispis;
}

function obradaDostupnostiDugme(stanje, idDugme){

    if(stanje)
        return `<a class="btn btn-dark-gray dugmeZaKorpu" href="#" data-idknjige="${idDugme}" >Add to cart</a>`;
    else
        return `<a href="#" class="btn btn-dark-gray btn-lg disabled" role="button" aria-disabled="true">Impossible to buy</a>`; 
}

//-----------


//##Logika##

function logika(){
    let nizIzabranihKat = [];

    $('input[name="kate"]:checked').each(function() {
        nizIzabranihKat.push(parseInt(this.value)); 
    });


    let knjigeF;
    if(nizIzabranihKat.length != 0)
        knjigeF = filtrirajPoKategoriji(nizIzabranihKat);
    else
        knjigeF = getLS("knjigeLS");
    
    
    let nizIzabranihPisaca = [];
    $('input[name="pis"]:checked').each(function() {
        nizIzabranihPisaca.push(parseInt(this.value)); 
    });


    if(nizIzabranihPisaca != 0)
        knjigeF = filtrirajPoPiscu(knjigeF, nizIzabranihPisaca);
    
    
    let stanje = $('input[name="stanje"]:checked').val();

    if(stanje == "0")
        knjigeF = knjigeF.filter(el => el.dostupnost == false);
    else
        knjigeF = knjigeF.filter(el => el.dostupnost == true);

    
    let tipSorta = document.querySelector("#tipSortiranja").value;
    if(tipSorta == "0"){
        ispisiKnjige(knjigeF);
    }
    else if(tipSorta == "1"){
        knjigeF.sort((el1, el2) => {
            if(el1.cena.aktuelnaCena < el2.cena.aktuelnaCena)
                return -1;
            else if(el1.cena.aktuelnaCena > el2.cena.aktuelnaCena)
                return 1;
            else 
                return 0;
        });
        console.log(knjigeF);
        ispisiKnjige(knjigeF);
    }
    else if(tipSorta == "2"){
        knjigeF.sort((el1, el2) => {
            if(el1.cena.aktuelnaCena > el2.cena.aktuelnaCena)
                return -1;
            else if(el1.cena.aktuelnaCena < el2.cena.aktuelnaCena)
                return 1;
            else 
                return 0;
        });
        ispisiKnjige(knjigeF);
    }
    else if(tipSorta == "3"){
        knjigeF.sort((el1, el2) => {
            if(el1.naslov < el2.naslov)
                return -1;
            else if(el1.naslov > el2.naslov)
                return 1;
            else 
                return 0;
        });
        ispisiKnjige(knjigeF);
    }
    else if(tipSorta == "4"){
        knjigeF.sort((el1, el2) => {
            if(el1.naslov > el2.naslov)
                return -1;
            else if(el1.naslov < el2.naslov)
                return 1;
            else 
                return 0;
        });
        ispisiKnjige(knjigeF);
    }

}

function filtrirajPoKategoriji(nizKat){
    let sveKnjige = getLS("knjigeLS");
    return sveKnjige.filter(el => el.idKat.some(y => nizKat.includes(y)));
    
}

function filtrirajPoPiscu(knjigeF, nizIzabranihPisaca){
    return knjigeF.filter(el => nizIzabranihPisaca.includes(el.idPisac));
}
//----

function ispisNajprodavanjih(){
    let sveKnjigeLS = getLS("knjigeLS");
    sveKnjigeLS.sort((el1, el2) => {
        if(el1.brojKupljenih > el2.brojKupljenih)
                return -1;
            else if(el1.brojKupljenih < el2.brojKupljenih)
                return 1;
            else 
                return 0;
    });

    let top3 = sveKnjigeLS.slice(0, 3);
    let ispis = "";
    for(let el of top3){
        ispis += `<li>
        <figure>
            <img src="${el.slika.src}" alt="${el.slika.alt}" width="105px" height="113px" />
        </figure>
        <a href="#">The Sonic Boom</a>
        <span class="price"><strong>Author:</strong>${obradaIme(el.idPisac)}</span>
        <span><strong>ISBN:</strong> ${el.isbn}</span>
        <div class="clearfix"></div>
    </li>`;
    }
    document.querySelector("#maxSell").innerHTML = ispis;
}


//Event ispis
function ispisiEvent(odg){
    let ispis = "";
    if(odg.length == 0){
        let poruka = `<div class="alert alert-danger" role="alert">
                    There are currently no books for the desired parameters
                    </div>`;
        document.querySelector("#dogadji").innerHTML = poruka;
    }
    else{
        for(let el of odg){
            ispis += `<div class="news-list-box">
            <div class="single-news-list">
                <figure>
                    <a href="#"><img src="${el.slika.src}" alt="${el.slika.alt}"></a>
                </figure>
                <div class="content-block">
                    <div class="member-info">
                        <div class="content_meta_category">
                            <span class="arrow-right"></span>
                            <a href="#" rel="category tag">EVENT</a>
                        </div>
                        <ul class="news-event-info">
                            <li>
                                <a href="#">
                                    <i class="fa fa-calendar"></i>
                                    ${el.datum}
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <i class="fa fa-clock-o"></i>
                                    ${el.vreme.pocetak} AM - ${el.vreme.kraj} PM
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <i class="fa fa-map-marker"></i>
                                    ${el.lokacija.grad}, ${el.lokacija.drzava}
                                </a>
                            </li>
                        </ul>
                        <h3><a href="#">${el.naslov}</a></h3>
                        <p>${el.sadrzaj}</p>
                        <a class="btn btn-primary" href="#">Read More</a>
                    </div>
                </div>
                <div class="clearfix"></div>
            </div>
        </div>`;
        }
        document.querySelector("#dogadji").innerHTML = ispis;
    }

}

function ispisiNajEvent(odg){
    odg.sort((el1, el2) => {
        if(el1.datum > el2.datum)
        return -1;
    else if(el1.datum < el2.datum)
        return 1;
    else 
        return 0;
    });

    let top1 = odg.slice(0, 1);
    
    let ispis = "";
    for(let el of top1){
        ispis += `<li>
        <figure>
            <img src="${el.slika.src}" alt="${el.slika.alt}" width="110px" height="115px"/>
        </figure>
        <a href="#">${el.naslov}</a>
        <span><i class="fa fa-calendar"></i> &nbsp; ${el.datum}</span>
        <span><i class="fa fa-clock-o"></i> &nbsp; ${el.vreme.pocetak} AM - ${el.vreme.kraj} PM</span>
        <span><i class="fa fa-map-marker"></i> &nbsp; ${el.lokacija.grad}, ${el.lokacija.drzava}</span>
        <div class="clearfix"></div>
    </li>`;
    }
    document.querySelector("#najEvent").innerHTML = ispis;
}


//Blog ispis
function ispisiBlog(odg){
    let ispis = "";
    for(let el of odg){
        ispis += ` <article>
        <div class="grid-item blog-item">
            <div class="post-thumbnail">
                <div class="post-date-box">
                   ${obradaDatuma(el.datum)}
                </div>
                <a href="#"><img alt="${el.slika.alt}" src="${el.slika.src}" class="img-fluid"/></a>
                <div class="post-share">
                    <a href="#."><i class="fa fa-comment"></i> ${el.brojKom}</a>
                    <a href="#."><i class="fa fa-thumbs-o-up"></i> ${el.brojLajkova}</a>
                    <a href="#."><i class="fa fa-eye"></i> ${el.brojPregleda}</a>
                </div>
            </div>
            <div class="post-detail">
                <header class="entry-header">
                    <div class="blog_meta_category">
                        <span class="arrow-right"></span>
                    </div>
                    <h3 class="entry-title"><a href="#">${el.naziv}</a></h3>
                    <div>
                        <span><i class="fa fa-user"></i> <a href="#">${el.tvorac.nazivT}</a> / ${el.datum}</span>
                    </div>
                </header>
                <div class="entry-content">
                    <p>${el.sadrzaj}</p>
                </div>
                <footer class="entry-footer">
                    <a class="btn btn-default" href="#">Read More</a>
                </footer>
            </div>
        </div>
    </article>`;
    }
    document.querySelector("#blogovi").innerHTML = ispis;
}

function obradaDatuma(datum){
    let nizD = datum.split("-");
    let ispis = `<div class="post-date">
            <a class="date" href="#">${nizD[0]}</a>
        </div>
        <div class="post-date-month">
            <a class="month" href="#">${nizD[1]}</a>
        </div>`;
    return ispis;
}

//Korpa - Logika
function dodajUKorpu(idkliknutog){

    let proizIzKorpe = getLS("korpaLS");
    if(proizIzKorpe == null || proizIzKorpe.length == 0){
        let nizObj = [];
        let obj = {
            id: idkliknutog,
            kolicina: 1
        };
        nizObj.push(obj);
        setLS("korpaLS", nizObj);
        brojProizUKorpi();
    }
    else{
        if(proveraSadrzineKorpe(proizIzKorpe, idkliknutog)){
            for(let el of proizIzKorpe){
                if(el.id == idkliknutog){
                    el.kolicina += 1;
                    break;
                }
            }
            setLS("korpaLS", proizIzKorpe);
        }
        else{
            let obj = {
                id: idkliknutog,
                kolicina: 1
            };
            proizIzKorpe.push(obj);
            setLS("korpaLS", proizIzKorpe);
            brojProizUKorpi();
        }
    }

}

function proveraSadrzineKorpe(proizIzKorpe, idkliknutog){
    let filtrirano = proizIzKorpe.filter(function(el){
        if(el.id == idkliknutog)
            return true;
    });
    
    if(filtrirano.length == 0)
        return false;
    else
        return true;
}

function brojProizUKorpi(){
    let korpa = getLS("korpaLS");
    document.querySelector(".brojElemenataKorpe").innerHTML = korpa.length;
}

function ispisiKorpu(){
    let sveKnjige = getLS("knjigeLS");
    let korpaLS = getLS("korpaLS");
    let ispis = ` <table class="table table-bordered shop_table cart">
    <thead>
        <tr>
            <th class="product-name">No.P</th>
            <th class="product-name">Title</th>
            <th class="product-quantity">Quantity</th>
            <th class="product-price">Action</th>                                                                
            <th class="product-subtotal">Total Price</th>
        </tr>
    </thead><tbody>`;
    let br = 1;
    let suma = 0;

    if(korpaLS == null || korpaLS.length == 0){
        document.querySelector("#krajKup").setAttribute("disabled", "disabled");
    }
    else{
        document.querySelector("#krajKup").removeAttribute("disabled");
    }

    if(korpaLS == null || korpaLS.length == 0){
        let poruka = `<div class="alert alert-danger" role="alert">
                    There are currently no books in cart
                    </div>`;
        document.querySelector("#mestoZaKorpu").innerHTML = poruka;
    }
    else{
        for(let el of korpaLS){
            for(let x of sveKnjige){
                if(el.id == x.id){
                    ispis += `
                        <tr class="cart_item">
                            <td class="product-cbox">
                                <span class="NoProiz">
                                    ${br++}
                                </span>
                            </td>
                            <td class="product-name">
                                <span class="product-thumbnail">
                                    <img src="${x.slika.src}" alt="${x.slika.alt}" width="100px" height="100px">
                                </span>
                                <span class="product-detail">
                                    <a href="#"><strong>${x.naslov}</strong></a>
                                    <span><strong>Author:</strong> ${obradaIme(x.idPisac)}</span>
                                    <span><strong>ISBN:</strong> ${x.isbn}</span>
                                    <span><strong>Price:</strong> <em>$${x.cena.aktuelnaCena}</em></span>
                                </span>
                            </td>
                            <td class="product-action">
                                <div class="dropdown">
                                    ${el.kolicina}
                                </div>
                            </td>
                            <td class="product-price">
                            <button type="button" class="btn btn-primary dugmeZaDodaj" data-idknjige="${el.id}">Add</button>
                            <button type="button" class="btn btn-secondary dugmeZaOduzmi" data-idknjige="${el.id}">Subtract</button>
                            <button type="button" class="btn btn-secondary dugmeZaObrisi" data-idknjige="${el.id}">Delete from cart</button>
                            </td>
                            <td class="product-remove">
                                $${el.kolicina * x.cena.aktuelnaCena}
                            </td>
                        </tr>`;
                        suma += el.kolicina * x.cena.aktuelnaCena;
                }
            }
        }
        ispis += `<tr><td></td><td></td><td></td><td></td><td>Total: $${suma.toFixed(2)}</td></tr></tbody></table></form>`;
        document.querySelector("#mestoZaKorpu").innerHTML = ispis;
    }
}


//F-ja za dodavanje kolicine iz korpe
function dodajKolicinu(idKlk){
    let korpaLS = getLS("korpaLS");
    for(let el of korpaLS){
        if(el.id == idKlk){
            el.kolicina++;
            break;
        }
    }
    setLS("korpaLS", korpaLS);
    ispisiKorpu();
}

//F-ja za brisanje iz korpe
function obrisiIzKorpe(idKlk){
    let korpaLS = getLS("korpaLS");
    let filtrirano = korpaLS.filter(el => {
        if(el.id != idKlk)
            return true
    });

    setLS("korpaLS", filtrirano);
    ispisiKorpu();
    brojProizUKorpi();
}

//F-ja za oduzimanje iz korpe
function oduzmiIzKorpe(idKlk){
    let korpaLS = getLS("korpaLS");
    let indi = 1;
    for(let el of korpaLS){
        if(el.id == idKlk){
            el.kolicina--;
            if(el.kolicina == 0)
                indi = 0;
            break;
        }
    }

    if(indi == 1){
        setLS("korpaLS", korpaLS);
        ispisiKorpu();
    }
    else{
        obrisiIzKorpe(idKlk);
    }
}

//RegEX
function testiraj(uneto, regExIzraz){
    return regExIzraz.test(uneto);
}

//ocistiGresku
function ocistiGresku(lokacijaPoljaPoruke){
    document.querySelector(lokacijaPoljaPoruke).setAttribute("style", `display: none;`);
}

function dodajGresku(lokacijaPoljaPoruke){
    document.querySelector(lokacijaPoljaPoruke).setAttribute("style", `display: block;`);
}

//LogikaTestirajRegEx - univerzalni blur za polje
function proveriPolje(polje, regEx, poruka){
    document.querySelector(polje).addEventListener("blur", function(){
        let uneto = this.value;
        if(testiraj(uneto, regEx)){
            document.querySelector(polje).nextElementSibling.setAttribute("style", `display: none;`);
        }
        else{
            document.querySelector(polje).nextElementSibling.setAttribute("style", `display: block;`);
            setTimeout(ocistiGresku, 3000, poruka);
        }
    });
}

//LogikaTestirajRegEx - univerzalni change za DDL
function proveriDDL(polje, poruka){
    document.querySelector(polje).addEventListener("change", function(){
        let izabrano = this.value; // skraceni nacin pristupa selektovanom optionu
        if(izabrano == "0"){
            document.querySelector(polje).nextElementSibling.setAttribute("style", `display: block;`);
            setTimeout(ocistiGresku, 3000, poruka);
        }
        else{
            document.querySelector(polje).nextElementSibling.setAttribute("style", `display: none;`);
        }
    });
}

//LogikaTestirajRegEx - univerzalna provera da li je neki radio kliknut
function proveriRadio(imeRadioGrupe, poruka){
        let sviRadio = document.querySelectorAll(`input[name="${imeRadioGrupe}"]`);
        let indi = 0;
        for(let el of sviRadio){
            if(el.checked){
                indi++;
                break;
            }
        }
        if(indi == 1){
            document.querySelector(poruka).setAttribute("style", `display: none;`);
            return 1;
        }
        else{
            document.querySelector(poruka).setAttribute("style", `display: block;`);
            return 0;
        }
}

//LogikaTestirajRegEx - univerzalna provera da li je textArea ima makar 12 karaktera
function proveriTextArea(polje, poruka){
    document.querySelector(polje).addEventListener("blur", function(){
        let uneto = this.value;
        if(uneto.length > 12){
            document.querySelector(polje).nextElementSibling.setAttribute("style", `display: none;`);
        }
        else{
            document.querySelector(polje).nextElementSibling.setAttribute("style", `display: block;`);
            setTimeout(ocistiGresku, 3000, poruka);
        }
    });
}

//Uzimanje vrednosti iz polja
function uzmiVredPolja(polje){
    return document.querySelector(polje).value;
}

//Brisanje vrednosti iz polja
function brisiVredPolja(polje){
    document.querySelector(polje).value = "";
}

function dodajInfo(lokacijaPoljaPoruke){
    document.querySelector(lokacijaPoljaPoruke).setAttribute("style", `display: block;`);
}

function osvezi(){
    location.reload();
}

