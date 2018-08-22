## Youtube Adventure Mapper

Some intrepid, possibly slightly mad, people on youtube like to create choose your own adventure games using videos and annotations which link to other videos.

One example is [The Dark Room](https://www.youtube.com/watch?v=OqozGZXYb1Y) by Australian comedian John Robertson.

This tool allows you to map these adventure games.

## Usage

`node youtube-adventure-mapper.js [url]`

Run it without providing a url and it will scrape the annotations of [The Dark Room](https://www.youtube.com/watch?v=OqozGZXYb1Y).

## Output
The output consists of two files:

 * output.json - a JSON representation of the videos and their annotation links to other videos.

 * output.dot - can plotted as a graph using the graphvis dot command.

 The DOT output can be turned into a fabulous visualisation using the command `dot -Tsvg ./output.dot > output.svg`.

 An example of the two output files and an svg graph are all available in this repository.

Here is the DOT visualisation of the map of The Dark Room:

![alttext](darkroom.svg)







