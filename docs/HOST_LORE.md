# JeoPARODY Host Lore Bible

## Status

This document defines the creative contract for the primary JeoPARODY host. The host's final public name is intentionally **not locked yet**. Do not hard-code `Xander` into new UI, dialogue, data schemas, filenames, analytics, or game logic. Use a stable semantic identifier such as `primary_host` / `host` until naming is resolved.

The host should feel like an original JeoPARODY character whose biography has become increasingly impossible to verify.

## Core character

The host presents himself as an experienced broadcaster, raconteur, traveler, occasional aristocrat, and survivor of events that either never happened or happened in mutually incompatible timelines.

His surface presentation can be polished and authoritative. Underneath it is a strange mixture of deadpan comedy, petty social grievances, cosmic experience, backstage chaos, old-fashioned phrasing, and complete confidence in stories that collapse under basic questioning.

He should not perform as a direct imitation of any real comedian. Influences shape rhythm and sensibility while his voice remains original.

## Comedy mentors and impossible encounters

A recurring lore thread is that the host claims to have befriended or encountered famous comedians across unusual realms, broadcasts, timelines, waiting rooms, casinos, restaurants, and other suspicious locations.

These stories are explicitly fantastical JeoPARODY mythology. They are not claims about real events.

### Norm Macdonald

The host claims that he befriended Norm Macdonald in another realm and that they had many adventures together.

Norm's influence on the host should be visible through broad comedic principles rather than imitation:

- comfort with long setups and unexpected destinations
- dry understatement
- refusing obvious punchlines
- allowing silence to become part of a joke
- deliberately antiquated or oddly formal phrasing
- treating the premise itself as suspicious
- acting mildly confused by his own story
- willingness to let a joke fail and then inspect the failure

The host's stories about Norm should contradict one another. One account may place them in Nevada, another in medieval Constantinople, another in a realm between broadcasts. The contradictions are part of the mythology.

### Bob Saget

The host also claims adventures or friendship with Bob Saget.

The useful influence is the contrast between polished television-host respectability and a much stranger, more chaotic backstage personality. The host can look perfectly composed while implying that the story immediately before airtime was profoundly inappropriate, disastrous, or inexplicable.

Do not reproduce Saget material or imitate specific routines.

### Larry David

The host claims to have encountered Larry David despite Larry being alive in the ordinary world.

This impossibility should never receive a satisfactory explanation.

The host may claim they met in places such as "the realm between commercials," then respond to objections as though the player's understanding of mortality or geography is the confusing part.

Larry's useful influence is grievance logic: tiny breaches of etiquette can occasionally bother the host more than whether the contestant was correct.

Example original JeoPARODY attitude:

> Correct. Your confidence while saying it was troubling, but correct.

Do not imitate Larry David's exact dialogue, plots, or copyrighted material.

## The unreliable biography rule

There should be no single clean chronology of the host's life.

Different artifacts may disagree about:

- his legal name
- age
- birthplace
- citizenship
- broadcasting history
- education
- former occupations
- marriages
- yacht ownership
- encounters with famous people
- whether he is alive in the conventional sense
- which realm he currently considers home

Contradictions should feel intentional and funny rather than careless.

The host generally does not acknowledge contradictions unless doing so creates a better joke.

## Naming

`Xander` is not canon.

The final name should support the character's strange broadcaster/aristocrat/cosmic-raconteur identity and work well in dialogue, UI, voice, merch, and branding.

Potential naming mechanics worth exploring:

- one absurdly long canonical name with a short stage name
- conflicting names on different historical artifacts
- a mundane nickname attached to an absurd formal name
- a name whose pronunciation the host occasionally changes
- an internal stable ID while display names remain presentation data

Do not make the name so close to Alex Trebek that the character becomes merely a renamed impersonation.

## Host Lore system

Treat lore as structured content that can eventually be surfaced through gameplay rather than as one giant biography dump.

Suggested schema:

```js
{
  id: "mentor-norm-realm-001",
  hostId: "primary_host",
  category: "mentor",
  tags: ["norm", "realm", "dubious"],
  rarity: "rare",
  contradictionGroup: "norm-first-meeting",
  unlock: {
    type: "performance_event"
  },
  text: "..."
}
```

Suggested categories:

- `mentor`
- `realm`
- `broadcast_history`
- `artifact`
- `grievance`
- `former_job`
- `romance`
- `yacht`
- `contradiction`
- `unresolved`

Suggested reliability tags:

- `plausible`
- `dubious`
- `contradicted`
- `impossible`
- `host_insists`

## Delivery rules

Lore should arrive in small fragments through:

- host asides
- rare reaction sequences
- loading/interstitial cards
- collectible lore cards
- blacklight Easter eggs
- documents or props in the set
- old broadcast clips / faux artifacts
- achievements
- environmental details
- callbacks to previous games

Do not repeatedly stop gameplay for lore exposition.

## Performance memory

Future host performance state should be able to remember recently surfaced lore so callbacks become possible and repetition stays controlled.

Useful state may include:

```js
{
  recentLoreIds: [],
  knownContradictions: [],
  recentGags: [],
  recentCameraShots: [],
  playerHasChallengedHostStory: false
}
```

This should integrate with the Director/Stage architecture without putting lore correctness into game scoring logic.

## Creative north star

Players should gradually realize that the man asking trivia questions has a completely unnecessary, increasingly suspicious biography.

The comedy comes from discovering fragments, noticing contradictions, and occasionally seeing old details pay off later.

The famous-comedian mythology is one thread in that larger character history, not the entire character.