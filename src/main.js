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

// Days of the week and month names
const ww = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const mm = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Return day of the week or month name based on a datetime object
const weekday = t => ww[t.getDay()];
const month = t => mm[t.getMonth()];

// Millisecond shortcuts (milliseconds * seconds * minutes...)
const msh = 36e5;
const msd = msh*24;

// Add hours or days to a datetime object
const addHours = (d, h) => new Date(d.getTime() + h * msh);
const addDays = (d, dd) => new Date(d.getTime() + dd * msd);

// Format a date or time into a string
const formatDate = n => {
    n = n.getDate();
    return (n % 10 === 1 && n % 100 != 11) ? `${n}st`
    : (n % 10 === 2 && n % 100 != 12) ? `${n}nd`
    : (n % 10 === 3 && n % 100 != 13) ? `${n}rd`
    : `${n}th`
}
const formatTime = d => {
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

// Shortcuts to combine stringified datetimes
const monthDay = t => `${month(t)} ${formatDate(t)}`;
const fullDate = t => `${weekday(t)}, ${monthDay(t)}`;
const monthDayTime = t => `${monthDay(t)} at ${formatTime(t)}`;
const fullDayTime = t => `${fullDate(t)}, ${formatTime(t)}`;

// Class-related functions
const checkClass = c => document.getElementsByClassName(c).length > 0;
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
if (checkClass("month")) {
    let monthNow = Number(getComputedStyle(document.documentElement).getPropertyValue('--m'));
    monthNow = monthNow == 4 ? mm[monthNow] : `${mm[monthNow].substring(0, 3)}.`;
    setClass("month", monthNow);
}

// Set year in header
if (checkClass("year")) {
    setClass("year", addDays(now, 14).getFullYear());
}

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
    event.length = event.length === "range" ? 1 : event.length;
    if (event.date === "tbd") {
        event.dateSort = new Date(1e14);
        event.dateName = new Date(1e14);
    } else if (event.length === "range") {
        event.dateSort = event.date[0] < now ? now : event.date[0];
        event.dateName = event.date[1];
        event.range = true;
    } else if (Array.isArray(event.date)) {
        const numDays = event.date.length;
        for (let i = 0; i < numDays; i++) {
            let day = event.date[i];
            if (addHours(day, event.length) < now && numDays !== 1) {
                event.date.shift();
                i--;
            } else {
                event.dateSort = day;
                event.dateName = day;
                break;
            }
        }
    } else {
        event.dateSort = event.date;
        event.dateName = event.date;
    }
});

// Sort and delete excess event data
events = events.sort((a, b) => a.dateSort - b.dateSort);
for (let i = 0; i < events.length; i++) {
    let event = events[i];
    if (event.dateSort < now) {
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
        endTime = event.noendtime ? `` : ` - ${formatTime(addHours(event.dateName, event.length))}`;
        if (event.date === 'tbd') {
            eventDate = `Date:&nbsp;TBD`
        } else if (event.range) {
            eventDate = `${fullDate(event.date[0])} - ${fullDate(event.date[1])}`;
        } else if (Array.isArray(event.date) && event.date.length > 1) {
            if (event.date[0].getDate() === event.date[1].getDate()) {
                eventDate = `${fullDate(event.date[0])}, ${formatTime(event.date[0])} and ${formatTime(event.date[1])}`;
            } else {
                eventDate = `${weekday(event.date[0])}s at ${formatTime(event.date[0])}${endTime} <br>`;
                event.date.forEach((day, i) => {
                    console.log(monthDay(day));
                    eventDate += i < event.date.length - 1 ? `${monthDay(day)},&nbsp;` : monthDay(day)
                });
                eventBr = `<br>`;
            }
        } else if (Array.isArray(event.date) && event.date.length === 1) {
            eventDate = `${fullDayTime(event.date[0])}${endTime}`;
        } else {
            eventDate = `${fullDayTime(event.date)}${endTime}`;
        }
        console.log(`${eventDate}`);
        if (addHours(event.dateName, event.length) >= now) {
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
        <p class="lh">We hope that you and your families are well and safe at home. We invite you to take advantage of our collection of eBooks and eAudios on <a href="https://ebook.yourcloudlibrary.com/library/raritanpl/Featured" target="_blank">cloudLibrary</a>, as well as <a href="https://www.hoopladigital.com/" target="_blank">hoopla</a> for additional eBooks, audiobooks, movies, comics, CDs and graphic novels. We also offer <a href="https://search.ebscohost.com/login.aspx?authtype=cpid&custid=s8971388" target="_blank"> Rosetta Stone</a> and <a href="http://learning.pronunciator.com/getstarted.php?library_id=7904" target="_blank"> Pronunciator</a> for you to develop your language skills, and <a href="https://www.ancestryheritagequest.com/" target="_blank"> Heritage Quest</a> for genealogical and other historical research.</p>
        <br>
        <p>If you need help connecting to these services, please call our Library at <b>(908) 725-0413</b>.</p>
    </div>`

    // Set the content to the class
    setClass(`main`, output)
}