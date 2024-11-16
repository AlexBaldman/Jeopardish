# New Task List
- Add animation for changing digits when score changes
- Or change scoreboard to be flippovers like an old school alarm clock or stock ticker
- Maybe a scrolling ticker animation announcing events along the bottom, or a random part of the screen

## Scoreboard
- make a new version of the scoreboard, in the style of the old school alarm clocks with the flipping panels and make it have a dope animation for the numbers changing along these lines
	
## Trebek animation ideas:
- add smoke animation to simulate smoke coming off his joint at random intervals
- sidle off edge of screen
- hide below screen slowly, then pop back up in surprised yelling “boo!” Or “surprise motherfucker, or other silly phrases
- AI generated responses of all sorts with system prompt guiding and defining his personality

# Trebek other interactivity:
- Cycle Trebeks in development & possibly later too...
	- for the moment (and possibly in final version in some way - remains to be seen but could be fun as an easter egg perhaps), i'd like to add the ability to click on Trebek to cycle through the various versions of him
	- as can be seen in the code, I currently have a whole bunch of different versions of trebek images being referenced in commented out code, and currently I've been just un-commenting out the one that I want to test, and leaving the rest commented out - but I'd like to add a trigger like clicking on right or left side of the title image to cycle left & right through the host images - so basically I'd want it to automatically scan the folder "inmages/trebek/" & include all images contained directly in that folder (not in the subfolders, just the ones directly in "images/trebek" ) to be the current host/trebek image options, and clicking the right side of the title image cycles forward, the left side cycles backward...

- 


## Chat bubble triangle at bottom:
- currently it goes away at 770 pixels width and below
- instead, I think at that width it should just move to the center of the bubble (that way it's still there, but not clashing with trebek)

## Event Ticker:
- add a comedic ticker that sometimes scrolls along the very bottom of the screen like a stock ticker but with funny commentary about things happening in the game, i.e. wow this guy is garbage, do you have a brain injury, no cheating, he's heating up! ( like NBA jam , and other funny silly lines for positive events, negative events, and other randomness, et cetera, especially a lot of Norm MacDonaldesque one liners and puns...  Create a json full of these and have them triggered periodically or sonemwhat randomly