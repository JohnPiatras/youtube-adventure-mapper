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

## Function: mapAdventure(url, callback)

Declared at **line 45** this is where a lot of the magic happens.

The first four lines initialise some variables we will need:

```javascript
46    let map = {};
47    let video_id = new URL(video_url).searchParams.get('v');
48    let completion_count = 0;
49    let video_count = 0;
```

In **line 47** we use the URL module to extract the *video_id* from the url.

The variable **map** will store our map of the videos in this adventure.

The variable **pending_videos** will be used to track how many videos we are currently fetching annotations for. This is intialised to zero, is incremented each time we start fetching annotations for a video and decremented when we finish fetching that video's annotations. When it returns to zero we call the function provided as an argument in the variable **callback**.

The variable **video_count** is incremented each time we find a video we have not already encountered. It is used to provide feedback on the number of unique videos encountered (output happens at **line 59**).

At **line 50** we declare the function *exploreVideo* nested within *mapAdventure*.

The *exploreVideo* function is called at **line 76** at which point we start a series of recursive calls to this function that will map out the adventure.

### Nested Function: exploreVideo(video_id)





