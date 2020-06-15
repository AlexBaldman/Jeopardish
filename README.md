# Project Overview

## Project Name

Jeopardish

## Project Description

A Jeopardy question & answer (answer & question) practice application along the lines of flash cards for Jeopardy questions

## API and Data Sample

[Jservice](http://www.jService.io)

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

Alex Trebek provides a comforting presence as potential Jeopardy contestants can click a button to randomly generate question/answer pairs like flash cards.

#### MVP 

- Create basic page with Trebek in foreground, Jeopardy stage in the background
- Pull random Jeopardy practice question/answer pairs - like flashcards for Jeopardy practice - from external API
- Render API data on page into a div or divs
- Possibly style div so that question and answer appear in a word-bubble coming from our inimitable host, or otherwise display data so that it can be clearly read
- Create button to get question & answer, and clear next question before populating next question when clicked again (possibly can divide into separate buttons with different functionality)

#### Post-MVP  

- Post MVP, "Jeopardish" may evolve in a number of ways
- Perhaps the button evolves into a vector of a hand holding the buzzer from the show
- Could add in background music, fancify styling, add transitions, @media queries for responsive design, etc.
- Depending on how the simpler stuff goes, could also make it into more of a game that actually keeps score, takes input to anwer the questions, keeps track of how many questions have been done, etc.
- May add box for more contextual information about each Question/Answer - i.e. category, question value, air-date of show it was asked on, etc.
- The original idea "JeopOrDad", would allow the user to now receive EITHER a random Jeopardy question OR a random "Dad Joke" - because let's face it, Trebek is a corny dad joke kind of guy.  Original idea was a bit too ambitious so scaled back to focus on getting more comfortable with the fundamentals. That second API that I had in mind for the Dad jokes is [ICanHazDadJoke](icanhazdadjoke.com/api), so keeping in mind for future projects


## Project Schedule

|  Day | Deliverable | Status
|---|---| ---|
|June 8| Project Prompt | Complete
|June 9| Wireframes / Priority Matrix / Timeframes | Complete
|June 10| Core App Structure (HTML, CSS, etc.) | Complete
|June 11| Initial Clickable Model  | Complete
|June 12| MVP | Complete
|June 15| Present | Partially complete

## Priority Matrix
![Priority Matrix](https://res.cloudinary.com/alexbaldman/image/upload/c_scale,w_832/v1591720490/Jeopardish/priority-matrix.png)

## Timeframes

An estimate of the amount of time I'm planning to spend on each area of development:

| Component | Priority | Estimated Time | Time Invested | Actual Time |
|---|---|---|---|---|
| Pseudocode | L |  2hrs | 1.5hrs | 2hrs |
| Basic HTML/CSS | M |  4hrs | 3.5hrs | 3.5hrs |
| Working with API | H | 4hrs| 5hrs | 5hrs |
| Customize Functionality w. Javascript | H | 5hrs| 6hrs | 6hrs |
| Post-MVP Functionality & Beautification | L | 5hrs| 5hrs | 5hrs |
| Total |  | 20hrs| 21.5hrs | 21.5hrs |

## Code Snippet

Stay tuned to this section, where I'll include brief code snippets of functionality I was proud of:

```
Had a hard time getting some of this to work, so was happy to get this working via trial and error, 
    questionBox.innerHTML += question;
    answerBox.innerHTML += answer;
```

 
