const https = require('https');
const util = require('util');
const repl = require('repl');
const url = require('url');
const fs = require('fs');
const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');
const svg2img = require('svg2img');
const btoa = require('btoa');

//external modules
const fetchVideoInfo = require('youtube-info');

//my modules
const YTFetchAnnotations = require('./YTFetchAnnotations.js');

//Utility functions
function inspect(object){
    console.log(util.inspect(object, false, null));
}

function ProgressBar(){
    this.spinner = '▌▀▐▄'.split('');
    this.spinner_index = 0;
    this.print = function(currentValue, totalValue){
        let percent = 100.0 * currentValue / totalValue;
        let progress_bar = "|";
    
        bar_fill = Math.floor(percent / 2);
    
        progress_bar = this.spinner[this.spinner_index] + ' |' + '='.repeat(bar_fill) + ' '.repeat(50 - bar_fill) + '|' + ` ${Math.floor(percent)}%`;
        this.spinner_index++;
        if(this.spinner_index > this.spinner.length-1)this.spinner_index = 0;
        process.stdout.write(`\r${progress_bar}`);    
    }
}

//Filter for Action type annotations, get the URLs and then video IDs.
function getAnnotationVideoIds(annotations){
    result = annotations 
        .filter( (annotation) => annotation.action && annotation.action[0].$.type === 'openUrl' )
        .map( annotation => {
            return new URL(annotation.action[0].url[0].$.value).searchParams.get('v');
        })
        .filter( (video_id) => video_id != null);
    return result;
}

function mapAdventure(url, callback){
    let map = {};
    let video_id = new URL(video_url).searchParams.get('v');
    let pending_videos = 0;
    let video_count = 0;
    function exploreVideo(video_id){
        pending_videos++;
        let annotation_video_ids = null;
        //console.log('Exploring video ' + video_id);
        YTFetchAnnotations(video_id, (err, result) => {
            //console.log('  Fetching annotations...');
            if(result)annotation_video_ids = getAnnotationVideoIds(result);
            if(!map[`${video_id}`]){
                video_count++;
                process.stdout.write('\rFound ' + video_count + ' videos...');
                map[`${video_id}`] = {   name: '',
                                    link: {}};
                if(annotation_video_ids){                    
                    annotation_video_ids.forEach((id, i) => {
                        map[`${video_id}`].link[+i] = id;
                        exploreVideo(id);
                    });
                }
            }else{
                //console.log('    Already mapped...');
            } 
            pending_videos--;
            if(pending_videos == 0)callback(map);         
        });
    }

    exploreVideo(video_id);
    return map;
}


function getTitles(map){
    let video_ids = Object.keys(map);
    let video_title_fetch_chain = Promise.resolve();
    let progress = new ProgressBar();

    console.log("\nRetreiving titles for " + video_ids.length + " videos...");
    video_ids.forEach( (id, i) => {
        
  
        video_title_fetch_chain =   video_title_fetch_chain
                                    .then( () =>    fetchVideoInfo(id)
                                                    .then( (video_info) => {map[id].name = video_info.title;progress.print(i, video_ids.length)})
                                    );
    });
    
    video_title_fetch_chain.then( () => {
        console.log();
        write_json(map);
        let dot = write_graph(map);
        write_images(dot);
    });
}

function write_json(map){
    json_map = JSON.stringify(map, undefined, 2);
    fs.writeFile("./output.json", json_map, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("Saved results to output.json");
    }); 

}

//writes graph to dot file, returns dot file as string
function write_graph(map){
    let output = [];
    let line = '';
    output.push('digraph {\n');

    for(key in map){
        line = `"${key}" [label="${map[key].name}"]\n`;
        output.push(line);
        for(link in map[key].link){
            line = `"${key}" -> "${map[key].link[link]}" [label="${link}"]\n`;
            output.push(line);
        }
    }
    output.push('}\n');
    output = output.join('');
    fs.writeFile("./output.dot", output, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("Saved graph to output.dot");
    }); 

    return output;
}

function write_images(dot){
    let viz = new Viz({ Module, render });
    viz.renderString(dot)
        .then(
            result => {
                fs.writeFile("./output.svg", result, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("Saved graph to output.svg");
                    svg2img(result, function(error, buffer) {
                        //returns a Buffer
                        fs.writeFileSync('output.png', buffer);
                        console.log("Saved graph to output.png");
                    });
                   
                });    
        })
        .catch(error => {
            console.error(error);
    });
}



//Supply a youtube video url at the command line, if none given use this as the default.
let video_url = process.argv[2];
if(!video_url) video_url = 'https://www.youtube.com/watch?v=Jm-Kmw8pKXw&feature=youtu.be';

console.log('Mapping Youtube adventure at ' + video_url);
let map = mapAdventure(video_url, getTitles);