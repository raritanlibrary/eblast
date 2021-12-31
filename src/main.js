import { load } from 'js-yaml';

// Function to request a response from a URL
const req = url => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    if (xhr.status === 200) {
        return xhr.responseText;
    }
};

// Time definitions
const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Format a date or time into a string
const formatDate = (n) => {
    return (n % 10 == 1 && n % 100 != 11) ? `${n}st`
    : (n % 10 == 2 && n % 100 != 12) ? `${n}nd`
    : (n % 10 == 3 && n % 100 != 13) ? `${n}rd`
    : `${n}th`
}
const formatTime = (d) => {
    const hh = d.getHours();
    const m = d.getMinutes().toString().padStart(2, 0);
    let dd = "AM";
    let h = hh;
    if (h >= 12) {
        h = hh - 12;
        dd = "PM";
    }
    if (h == 0) {
        h = 12;
    }
    return `${h}:${m} ${dd}`;
}

// Function to add time to a date object
const addHours = (d, h) => new Date(d.getTime() + h*60*60*1000);
const addDays = (d, h) => new Date(d.getTime() + h*24*60*60*1000);

// Class-related functions
const checkClass = (c) => document.getElementsByClassName(c).length > 0;
const setClass = (c, str, n=0) => document.getElementsByClassName(c)[n].innerHTML = str;

// Load data
const newsData = req(`https://raw.githubusercontent.com/raritanlibrary/www/main/src/data/news.yaml`)
const eventData = req(`https://raw.githubusercontent.com/raritanlibrary/www/main/src/data/events.yaml`)
let news = load(newsData);
let events = load(eventData);
const now = new Date();

// Grab amount of colors in palette
const colors = Number(getComputedStyle(document.documentElement).getPropertyValue('--palette-length'));

// Set month in header
let monthNow = Number(getComputedStyle(document.documentElement).getPropertyValue('--m'));
monthNow = monthNow == 4 ? month[monthNow] : `${month[monthNow].substring(0, 3)}.`;
setClass(`month`, monthNow)

// Set year in header
setClass(`year`, addDays(now, 14).getFullYear())

// Sort and delete excess news data
news = news.sort((a, b) => a.date - b.date);
for (let i = 0; i < news.length; i++) {
    let entry = news[i];
    if (entry.date < addDays(now, -30) || entry.hidden) {
        news.splice(i, 1);
        i--;
    }
}

// Organize event data
events.forEach(event => {
    if (event.date === 'tbd') {
        event.datesortable = addHours(now, event.length);
        event.datenominal = addHours(now, event.length);
        event.zoom = false;
    } else if (event.length === 'daterange') {
        event.length = 1;
        event.datenominal = event.date[1];
        event.daterange = true;
        if (event.date[0] < now) {
            event.datesortable = now;
        } else {
            event.datesortable = event.date[0];
        }
    } else if (Array.isArray(event.date)) {
        for (let i = 0; i < event.date.length; i++) {
            let day = event.date[i];
            if (addHours(day, event.length) < now && event.date.length !== 1) {
                event.date.shift();
                if (event.zoom) {
                    event.zoom.shift();
                }
                i--;
            } else {
                event.datesortable = day;
                event.datenominal = day;
                if (event.zoom) {
                    event.zoom = event.zoom[0];
                }
                break;
            } 
        }
    } else {
        event.datesortable = event.date;
        event.datenominal = event.date;
    }
});

// Sort and delete excess event data
events = events.sort((a, b) => a.datesortable - b.datesortable);
for (let i = 0; i < events.length; i++) {
    let event = events[i];
    if (event.datesortable < now) {
        events.splice(i, 1);
        i--;
    }
}

// Set to .main
if (checkClass(`main`)) {
    // Inject news into HTML
    let output = ``;
    let color = colors != 1 ? 1 : 0;
    news.forEach(post => {
        output += `
        <div class="content${color}">
            <h2 >${post.name}</h2>
            <br>
            <p class="lh">${post.desc}</p>
        </div>
        `
        color = color != colors-1 ? color + 1 : 0;
    });

    // Inject events into HTML
    let endTime;
    events.forEach(event => {
        let eventDate;
        let eventBr = ``;
        if (!event.noendtime) {
            endTime = ` - ${formatTime(addHours(event.datenominal, event.length))}`;
        } else {
            endTime = ``
        }
        if (event.date === 'tbd') {
            eventDate = `Date:&nbsp;TBD`
        } else if (event.daterange) {
            eventDate = `${weekday[event.date[0].getDay()]}, ${month[event.date[0].getMonth()]} ${formatDate(event.date[0].getDate())} - ${weekday[event.date[1].getDay()]}, ${month[event.date[1].getMonth()]} ${formatDate(event.date[1].getDate())}`;
        } else if (Array.isArray(event.date) && event.date.length > 1) {
            if (event.date[0].getDate() === event.date[1].getDate()) {
                eventDate = `${weekday[event.date[0].getDay()]}, ${month[event.date[0].getMonth()]} ${formatDate(event.date[0].getDate())}, ${formatTime(event.date[0])} and ${formatTime(event.date[1])}`;
            } else {
                eventDate = `${weekday[event.date[0].getDay()]}s at ${formatTime(event.date[0])}${endTime} <br>`
                event.date.forEach((day, i) => {
                    eventDate += `${month[day.getMonth()]} ${formatDate(day.getDate())}`
                    if (i < event.date.length-1) { eventDate += `,&nbsp;` }
                });
                eventBr = `<br>`;
            }
        } else if (Array.isArray(event.date) && event.date.length === 1) {
            eventDate = `${weekday[event.date[0].getDay()]}, ${month[event.date[0].getMonth()]} ${formatDate(event.date[0].getDate())}, ${formatTime(event.date[0])}${endTime}`
        } else {
            eventDate = `${weekday[event.date.getDay()]}, ${month[event.date.getMonth()]} ${formatDate(event.date.getDate())}, ${formatTime(event.date)}${endTime}`
        }
        if (addHours(event.datenominal, event.length) >= now) {
            output += `
            <div class="snippet${color}">
                <img class="snippet${color}__image" src="https://raritanlibrary.org/img/events/_${event.img}.png">
                <div class="snippet${color}__desc">
                    <h3 >${event.name}</h3>
                    <p class="comment space">${eventDate}</p>
                    ${eventBr}
                    <p class="lh">${event.desc}</p>
                </div>
            </div>
            `
        }
        color = color != colors-1 ? color + 1 : 0;
    });

    // Set last block
    output += `
    <div class="content${color}">
        <p class="lh">We hope that you and your families are well and safe at home. We invite you to take advantage of our collection of eBooks and eAudios on <a href="https://ebook.yourcloudlibrary.com/library/raritanpl/Featured" target="_blank">cloudLibrary</a>, as well as <a href="https://www.hoopladigital.com/" target="_blank">hoopla</a> for additional eBooks, audiobooks, movies, comics, CDs and graphic novels. We also offer <a href="https://search.ebscohost.com/login.aspx?authtype=cpid&custid=s8971388&site=rosetstone&return=y&groupid=main" target="_blank"> Rosetta Stone</a> and <a href="http://learning.pronunciator.com/getstarted.php?library_id=7904" target="_blank"> Pronunciator</a> for you to develop your language skills, and <a href="https://www.ancestryheritagequest.com/" target="_blank"> Heritage Quest</a> for genealogical and other historical research.</p>
        <br>
        <p>If you need help connecting to these services, please call our Library at <b>(908) 725-0413</b>.</p>
    </div>`

    // Set the content to the class
    setClass(`main`, output)
}