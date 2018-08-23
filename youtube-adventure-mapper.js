const https = require('https');
const util = require('util');
const repl = require('repl');
const url = require('url');
var fs = require('fs');

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
    let completion_count = 0;
    let video_count = 0;
    function exploreVideo(video_id){
        completion_count++;
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
            completion_count--;
            if(completion_count == 0)callback(map);         
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
        write_graph(map);
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
    fs.writeFile("./output.dot", output.join(''), function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("Saved graph to output.dot");
    }); 
}



//Supply a youtube video url at the command line, if none given use this as the default.
let video_url = process.argv[2];
if(!video_url) video_url = 'https://www.youtube.com/watch?v=Jm-Kmw8pKXw&feature=youtu.be';

let video_id = new URL(video_url).searchParams.get('v');

console.log('Mapping Youtube adventure at ' + video_url);
let map = mapAdventure(video_url, getTitles);