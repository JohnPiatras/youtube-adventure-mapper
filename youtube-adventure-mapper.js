const https = require('https');
const util = require('util');
const repl = require('repl');
const url = require('url');
const fs = require('fs');

//external modules
const fetchVideoInfo = require('youtube-info');
const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');
const svg2img = require('svg2img');
const btoa = require('btoa');
const normalizeUrl = require('normalize-url');

//my modules
const YTFetchAnnotations = require('./YTFetchAnnotations.js');
const ProgressBar = require('./ProgressBar.js');
//Globals
let output_filename = "output";

//Utility functions
function inspect(object){
    console.log(util.inspect(object, false, null));
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

function mapAdventure(url){
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
            if(pending_videos == 0)main_callback('get_titles', map);        
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
                                                    .then( (video_info) => {map[id].name = video_info.title;progress.print(i + 1, video_ids.length)})
                                    );
    });
    
    video_title_fetch_chain.then( () => {
        console.log();
        main_callback('write_files', map);
    });
}

function writeFiles(map){
    let json = JSON.stringify(map, undefined, 2);
    write_file_sync(output_filename + ".json", json);

    let dot = map2dot(map);
    write_file_sync(output_filename + ".dot", dot);

    dot2svg(dot).then(result => {
        write_file_sync(output_filename + ".svg", result);
        svg2img(result, function(error, buffer) {
            if(error){
                console.log(error);
            }else{
                write_file_sync(output_filename + ".png", buffer);
            }
        });
    });
}

function write_file_sync(filename, buffer){
    try{
        fs.writeFileSync(filename, buffer);
    }catch(e){
        console.log("Error writing " + filename + ": " + e);
    }
    console.log("Saved graph to " + filename);
}

//writes graph to dot file, returns dot file as string
function map2dot(map){
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
    return output.join('');
}

async function dot2svg(dot){
    let viz = new Viz({ Module, render });
    let svg = await viz.renderString(dot);
    return svg;
}

function usage(){
    console.log("Usage: ");
    console.log("  youtube-adventure-mapper <options> [url]\n");
    console.log("    [url] should be a youtube video url. You may also use one of the following values to use a built in url:");
    console.log("      escape - a short youtube adventure");
    console.log("      darkroom - The Dark Room by John Robertson, a fairly larege adventure");
    console.log();
    console.log("    Options:");
    console.log("      -o filename : specify output filename, otherwise default, 'output' is used.");
    process.exit();
}

function validate_url(url_string){
    try{
        let url = new URL(normalizeUrl(url_string));
        let video_id = url.searchParams.get('v');
        if(url.host === 'youtube.com' && video_id != null){
            return url;
        }
    }catch(e){
        console.log(e);
    }
    return null;
}


//This is a placeholder till I switch to using promises rather than callbacks everywhere
function main_callback(state, arg){
    //states: map_videos, get_titles, write_files
    switch(state) {
        case 'map_videos':
            mapAdventure(arg);
            break;
        case 'get_titles':
            getTitles(arg);
            break;
        case 'write_files':
            writeFiles(arg);
            break;
    }
}

//Supply a youtube video url at the command line, if none given use this as the default.
let def_urls = new Map([
    ["escape", "https://www.youtube.com/watch?v=OqozGZXYb1Y"],
    ["darkroom", "https://www.youtube.com/watch?v=Jm-Kmw8pKXw&feature=youtu.be"],
]);


//get args
let nargs = process.argv.length - 2;
if(nargs === 0) usage();
let cur_arg = 2;

if(process.argv[cur_arg][0] === '-'){
    if(process.argv[cur_arg] === '-o'){
        cur_arg++;
        output_filename = process.argv[cur_arg];
        cur_arg++;
    }else{
        console.log("Unknown option: " + process.argv[2]);
        usage();
    }
}
video_url = process.argv[cur_arg];
if(def_urls.has(video_url))video_url = def_urls.get(video_url);


video_url = validate_url(video_url);
if(!video_url){
    console.log('url MUST be a valid youtube.com video url');
    usage();
}


console.log('Mapping Youtube adventure at ' + video_url);
console.log('Base output filename is: ' + output_filename);


main_callback('map_videos', video_url);