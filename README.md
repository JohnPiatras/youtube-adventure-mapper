## Youtube Annotation Scraper

When complete this will provide a function for scraping the annotations, and walking any link annotations, of a youtube video.


## Usage

node annotation-scraper.js [url]

Run it without providing a url and it will scrape the annotations of this video: https://www.youtube.com/watch?v=OqozGZXYb1Y

The end result should be an object with the following structure:

```
Video { 
	title: 'video title', 
	id: 'video id', 
	next_video: [] 
	}
```

The next_video array contains another Video element for each of the annotations that linked to another video.

At the moment once it has completed it will drop you into a node console where you can play with the results, available as the var "videos".






