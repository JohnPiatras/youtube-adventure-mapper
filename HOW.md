# How the youtube-adventure-mapper works

In this document I shall attempt to explain how the adventure mapper works.

As noted in README.md the adventure mapper is invoked with the following command:

`node youtube-adventure-mapper.js [url]`

I'm going to cover what happens in order.

## Invocation

Most of youtube-adenture-mapper.js consists of function declarations but the actual entry point when the command is run is at **line 140**.

```javascript
140 let video_url = process.argv[2];
141 if(!video_url) video_url = 'https://www.youtube.com/watch?v=Jm-Kmw8pKXw&feature=youtu.be';
142
143 console.log('Mapping Youtube adventure at ' + video_url);
144 let map = mapAdventure(video_url, getTitles);
```

Here we assume that a video url has been provided as an argument (argv[0] is the path to the node executable used to run the script, argv[1] is the path to the script being run, anything after that is a command line argument).

If a url was not supplied then video_url is undefined and the if statement sets the url to that of the Dark Room by John Robertson.

In line 144 the video_id is passed to the mapAdventure function along with a reference to the getTitles function.

## The mapAdventure(url, callback) function



