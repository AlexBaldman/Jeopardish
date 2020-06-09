# Project Overview

## Project Name

Jeopardish

## Project Description

A Jeopardy question & answer (answer & question) practice application along the lines of flash cards for Jeopardy questions

## API and Data Sample

[Jservice](www.jService.io)

```JSON

{
  "id":6995,
  "answer":"liberty",
  "question":"One-word term for an authorized leave from duty; to a sailor it means freedom for 48 hours or less",
  "value":200,
  "airdate":"1990-01-23T12:00:00.000Z",
  "created_at":"2014-02-11T22:50:54.251Z",
  "updated_at":"2014-02-11T22:50:54.251Z",
  "category_id":914,
  "game_id":null,
  "invalid_count":null,
  "category": 
    {
    "id":914,
    "title":"the navy","created_at":"2014-02-11T22:50:54.061Z","updated_at":"2014-02-11T22:50:54.061Z","clues_count":5
    }
}
```

## Wireframe

![Wireframe](https://res.cloudinary.com/alexbaldman/image/upload/v1591716508/Jeopardish/wireframe.png)
Alex Trebek asks you a question when you press the button, press again to reveal answer.  May also include further context about each question in the further info box.

#### MVP 

- Pull random Jeopardy practice question/answer pairs - like flashcards for Jeopardy practice - from external API
- Render data on page into a div
- Style div so that question and answer appear in a word-bubble coming from our host, Mr. Alex Trebek
- Create button to toggle question/answer
- Another button to get next question

#### Post-MVP  

- Post MVP, "Jeopardish" may evolve in a number of ways
- Perhaps the button evolves into a vector of a hand holding the buzzer from the show
- Could add in background music, fancify styling, add transitions, @media queries for responsive design, etc.
- May add box for more contextual information about each Question/Answer - i.e. category, question value, air-date of show it was asked on, etc.
- Another Post-MVP idea to allow experimenting with implementing data from a second API, is to morph it into a second project, "JeopOrDad", which would allow the user to now receive EITHER a random Jeopardy question OR a random "Dad Joke" - because let's face it, Trebek is a corny dad joke kind of guy
- This second API that I have in mind for the Dad jokes is [ICanHazDadJoke](icanhazdadjoke.com/api)


## Project Schedule

|  Day | Deliverable | Status
|---|---| ---|
|June 8| Project Prompt | Complete
|June 9| Wireframes / Priority Matrix / Timeframes | Complete
|June 10| Core App Structure (HTML, CSS, etc.) | Shall Begin When Approved
|June 11| Initial Clickable Model  | Incomplete
|June 12| MVP | Incomplete
|June 15| Present | Incomplete

## Priority Matrix
![Priority Matrix](https://res.cloudinary.com/alexbaldman/image/upload/v1591719227/Jeopardish/priority-matrix.png)

## Timeframes

An estimate of the amount of time I'm planning to spend on each area of development:

| Component | Priority | Estimated Time | Time Invested | Actual Time |
|---|---|---|---|---|
| Pseudocode | L |  2hrs | TBD | TBD |
| Basic HTML/CSS | M |  4hrs | TBD | TBD |
| Working with API | H | 4hrs| TBD | TBD |
| Customize Functionality w. Javascript | H | 5hrs| TBD | TBD |
| Post-MVP Functionality & Beautification | L | 5hrs| TBD | TBD |
| Total | --- | 20hrs| TBD | TBD |

## Code Snippet

Stay tuned to this section, where I'll include brief code snippets of functionality I was proud of:

```
function reverse(string) {
	// As an example, here's some code I might use to reverse a string of text
  // Exciting times!!!
}
```

## Change Log
 This section will be used to document changes that were made and the reasoning behind them.
 
