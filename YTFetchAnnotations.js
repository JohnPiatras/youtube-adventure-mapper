const https = require('https');
const parseString = require('xml2js').parseString;

function YTFetchAnnotations(video_id, callback){
    let collected_data = [];
    let url = "https://www.youtube.com/annotations_invideo?features=1&legacy=1&video_id="+video_id;

    https.get(url, (res) => {
        res.setEncoding('utf8');

        res.on('data', (data) => {
            collected_data.push(data);
        });

        res.on('end', (data) => {
            collected_data = collected_data.join("");

            parseString(collected_data, (err, result) => { 
                if(err){
                    callback(err, null);
                }
                let annotations = null;
                if(result && result.document.annotations[0].annotation){
                    annotations = result.document.annotations[0].annotation;
                }
                
                callback(null, annotations);
            });
        });

        res.on('error', (err) => {
            callback(err, null);
        });


    });
}

module.exports = YTFetchAnnotations;
