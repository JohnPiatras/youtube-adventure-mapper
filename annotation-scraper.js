const https = require('https');
const util = require('util');
const repl = require('repl');
const url = require('url');

const fetchVideoInfo = require('youtube-info');
const parseString = require('xml2js').parseString;


function inspect(object){
    console.log(util.inspect(object, false, null));
}

function build_annotation_tree(video, callback){
    let async_title_fetch_count = 0;
    let visited_videos = [];

    function build_tree_recursively(video){
        /*async_title_fetch_count++;
        fetchVideoInfo(video.id, (err, info) => {
            if(err){
                console.log(err);                
            }else{
                video.title = info.title;
            }
            async_title_fetch_count--;
            console.log(async_title_fetch_count);
            if(async_title_fetch_count == 0)callback();
        });*/

        if(visited_videos.includes(video.id)){
            return;
        }

        visited_videos.push(video.id);
        
        let annotation_xml_url = "https://www.youtube.com/annotations_invideo?features=1&legacy=1&video_id="+video.id;
        let xml_data = '';
        https.get(annotation_xml_url, (res) => {
            
            res.setEncoding('utf8');
            res.on('data', (data) => {
                xml_data = xml_data + data;
            });
            res.on('end', (data) => {
                parseString(xml_data, (err, result) => {
                    if(err){
                        return console.error(err);
                    }
                    if(result){
                        let annotation_array = result.document.annotations[0].annotation;
                        if(annotation_array){
                            annotation_array.forEach( annotation => {
                                if(annotation.action){
                                    if(annotation.action[0].$.type === 'openUrl'){
                                        next_video_id = new URL(annotation.action[0].url[0].$.value).searchParams.get('v');
                                        video.next_video.push(new Video(next_video_id));
                                        
                                    }
                                }
                            });
                        }
                    }

                    console.log(video);
                    video.next_video.forEach( v => build_tree_recursively(v));
                });
                
            });


        });
    }
    build_tree_recursively(video);

}

//URL for getting xml file containing a video's annotations looks like this:
//https://www.youtube.com/annotations_invideo?features=1&legacy=1&video_id=9XgQEEBnTsY



//Supply a youtube video url at the command line, if none given use this as the default.
let video_url = process.argv[2];
if(!video_url){
    video_url = 'https://www.youtube.com/watch?v=Jm-Kmw8pKXw&feature=youtu.be' 
}

let video_id = new URL(video_url).searchParams.get('v');

//constructor for Video class
function Video(video_id){
    this.title = '';
    this.id = video_id;
    this.next_video = [];
}

let video_tree = new Video(video_id);

function print_tree(){
    inspect(video_tree);
}


build_annotation_tree(video_tree, print_tree);

repl.start('> ').context.videos = video_tree;


