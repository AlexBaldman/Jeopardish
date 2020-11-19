# Jeopardish

## Overview

A 'Jeopardish' question/answer (answer/question?) practice application.  MVP intended to function initially
like a random flash card generator, and to serve as a sandbox for testing various ideas regarding trivia-type game development.

Alex Trebek provided a comforting presence - and a moustache to lean on - to Jeopardy contestants for many years.

Jeopardish can provide that same comforting presence to future potential contestants (if they don't end the show now that he's gone!).

Users can practice for the show using the simple click of a button to randomly generate question/answer pairs from a database of questions from old episodes, like flash cards to help learn random facts from a plethora of historical categories from the show.


## API and Data Sample

![Jservice](http://www.jService.io)

```JSON
{
  "id": 6995,
  "answer": "liberty",
  "question": "One-word term for an authorized leave from duty; to a sailor it means freedom for 48 hours or less",
  "value": 200,
  "airdate": "1990-01-23T12:00:00.000Z",
  "created_at": "2014-02-11T22:50:54.251Z",
  "updated_at": "2014-02-11T22:50:54.251Z",
  "category_id": 914,
  "game_id": null,
  "invalid_count": null,
  "category": {
    "id": 914,
    "title": "the navy",
    "created_at": "2014-02-11T22:50:54.061Z",
    "updated_at": "2014-02-11T22:50:54.061Z",
    "clues_count": 5
    }
}

```
## Wireframe

![Wireframe](https://res.cloudinary.com/alexbaldman/image/upload/v1591716508/Jeopardish/wireframe.png)

## Priority Matrix

![Jeopardish Priority Matrix](https://res.cloudinary.com/alexbaldman/image/upload/c_scale,w_832/v1591720490/Jeopardish/priority-matrix.png)

## MVP 

- A simple one page application, with a layout having Alex Trebek in foreground, and the Jeopardy stage in the background
- Pull random Jeopardy practice answer/question pairs - like flashcards for Jeopardy practice - from JService external API
- Render API data on page into their own divs on the page
- Various possibilities for styling.  Some ideas: styling a single div so that question and answer appear in a word-bubble coming from our inimitable host, styling actual flash cards that could be animated to flip over and reveal the answer, putting them on an actual Jeopardy screen with classic blue background, etc.
- Create a button to trigger a new question & answer, and clear next question before populating next question when clicked again (possibly can divide into separate buttons with different functionality)

## Post-MVP  

Post MVP, "Jeopardish" may evolve in a number of ways:

- At first, I'll be just displaying the question and answer together at the same time, but 
- Perhaps the button evolves into a vector of a hand holding the buzzer from the show
- Could add in background music, fancify styling, add transitions, @media queries for responsive design, etc.
- Depending on how the simpler stuff goes, could also make it into more of a game that actually keeps score, takes input to anwer the questions, keeps track of how many questions have been done, etc.
- May add box for more contextual information about each Question/Answer - i.e. category, question value, air-date of show it was asked on, etc.
- The original idea "JeopOrDad", would allow the user to now receive EITHER a random Jeopardy question OR a random "Dad Joke" - because let's face it, Trebek is a corny dad joke kind of guy.  Original idea was a bit too ambitious so scaled back to focus on getting more comfortable with the fundamentals. That second API that I had in mind for the Dad jokes is [ICanHazDadJoke](icanhazdadjoke.com/api), so keeping in mind for future projects


## Project Schedule

|  Day | Deliverable | Status |
|---|---|---|
|June 8| Project Prompt | Complete
|June 9| Wireframes / Priority Matrix / Timeframes | Complete
|June 10| Core App Structure (HTML, CSS, etc.) | Complete
|June 11| Initial Clickable Model  | Complete
|June 12| MVP | Complete
|June 15| Present | Partially complete


## Timeframes

Estimated time on each area of development:

| Component | Priority | Estimated Time | Time Invested | Actual Time |
|---|---|---|---|---|
| Pseudocode | L |  2hrs | 1.5hrs | 2hrs |
| Basic HTML/CSS | M |  4hrs | 3.5hrs | 3.5hrs |
| Working with API | H | 4hrs| 5hrs | 5hrs |
| Customize Functionality w. Javascript | H | 5hrs| 6hrs | 6hrs |
| Post-MVP Functionality & Beautification | L | 5hrs| 5hrs | 5hrs |
| Total |---| 20hrs| 21.5hrs | 21.5hrs |

## Code Highlights

Repopoulating question & answerboxes from within API call function:

```
  questionBox.innerHTML += question;
  answerBox.innerHTML += answer;

```

 
