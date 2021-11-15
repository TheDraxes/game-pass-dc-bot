const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

const { Worker }  = require('worker_threads');


let workDir = __dirname + "/dbWorker.js";

const mainFunc = async () => {
    const url = "https://www.pc-magazin.de/ratgeber/game-pass-spiele-neu-alle-games-liste-xbox-one-xbox-360-pc-play-anywhere-3200215-17084.html";

    const keys = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 
        'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 
        'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];

    let res = await fetchData(url);
    if(!res.data){
      console.log("Invalid data Obj");
      return;
    }

    const html = res.data;
    let dataObj = new Object();
    const $ = cheerio.load(html);

    const list = $("#articleContentContainer > ul > li");

    var gameTitles = [];
    var errors = [];

    list.each(function() {
        let gameTitle = $(this).text();
        gameTitles.push(gameTitle);
    });

    gameTitles.forEach(title => {
        let titlePushed = false;
        for(let key of keys) {
            if (dataObj[key] === undefined) {
                dataObj[key] = [];
            }
            if(title.startsWith(key) || title.startsWith(key.toLowerCase()))
            {
                dataObj[key].push(title)
                titlePushed = true;
                break;
            }            
        }
        if(!titlePushed) errors.push(title);
    })

    dataObj['errors'] = errors;

    return dataObj;
}

// '0 12,22 * * *'
const job = schedule.scheduleJob('0 12,22 * * *', function(){
    mainFunc().then((res) => {
        // start worker
        const worker = new Worker(workDir); 
        console.log("Sending crawled data to dbWorker...");
        // send formatted data to worker thread 
        worker.postMessage(res);
        // listen to message from worker thread
        worker.on("message", (message) => {
            console.log(message)
        });
    });
});

async function fetchData(url){
    console.log("Crawling data...")
    let response = await axios(url).catch((err) => console.log(err));

    if(response.status !== 200){
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}
