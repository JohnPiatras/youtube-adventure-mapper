const https = require('https');
const util = require('util');
const repl = require('repl');
const url = require('url');
var fs = require('fs');

//external modules
const fetchVideoInfo = require('youtube-info');

//my modules
const YTFetchAnnotations = require('./YTFetchAnnotations.js');

function inspect(object){
    console.log(util.inspect(object, false, null));
}

//Filter for Action type annotations, get the URLs and then video IDs.
function getAnnotationVideoIds(annotations){
    result = annotations 
        .filter( (annotation) => annotation.action && annotation.action[0].$.type === 'openUrl' )
        .map( annotation => {
            return new URL(annotation.action[0].url[0].$.value).searchParams.get('v');
        });
    return result;
}


//Supply a youtube video url at the command line, if none given use this as the default.
let video_url = process.argv[2];
if(!video_url) video_url = 'https://www.youtube.com/watch?v=Jm-Kmw8pKXw&feature=youtu.be';

let video_id = new URL(video_url).searchParams.get('v');

function mapAdventure(url, callback){
    let map = {};
    let video_id = new URL(video_url).searchParams.get('v');
    let completion_count = 0;

    function exploreVideo(video_id){
        completion_count++;
        let annotation_video_ids = null;
        //console.log('Exploring video ' + video_id);
        YTFetchAnnotations(video_id, (err, result) => {
            //console.log('  Fetching annotations...');
            if(result)annotation_video_ids = getAnnotationVideoIds(result);
            if(!map[`${video_id}`]){
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
    //We've mapped the adventure, now grab the video titles.
    console.log('Fetching video titles');
    let async_title_fetch_count = 0;

    let video_ids = Object.keys(map);
    let cur_id = 0;
    
    getVideoTitles();
    
    function getVideoTitles(){
        fetchVideoInfo(video_ids[cur_id], (err, info) => {
            console.log("ID = " + video_ids[cur_id]);
            if(err){
                console.log(err);                
            }else{
                map[video_ids[cur_id]].name = info.title;
                console.log("  title = " + info.title);
            }
            cur_id++;
            if(cur_id >= video_ids.length){
                done();
            }else{
                getVideoTitles();
            }
        });
    }


    function done(){
        json_map = JSON.stringify(map, undefined, 2);
        fs.writeFile("./output.json", json_map, function(err) {
            if(err) {
                return console.log(err);
            }
        
            console.log("Saved results to output.json");
        }); 
        write_graph(map);
    }
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


console.log('Calling mapAdventure()');
let map = mapAdventure(video_url, getTitles);



//repl.start('> ').context.map = map;



