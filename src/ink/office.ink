=== examine_desk ===
~ triggerMonologue("perception", 7, "The dust on this desk has been disturbed. Recently.")
~ triggerMonologue("logic", 6, "One open drawer, everything else locked. Whoever left this made a choice.")
~ triggerMonologue("empathy", 8, "She looked happy in this photo. Someone wanted you to feel that before you saw the X.")
~ triggerMonologue("composure", 5, "You've seen worse. Probably.")

The top drawer opens easily. Inside: a photograph, face-down.

You turn it over. She's smiling.

~ temp noticed = skillCheck("perception", 8)
{noticed:
    The ink on the X is still tacky. This was left within the last hour.
- else:
    Someone's drawn a red X across her face in marker.
}

* [Look closer at the photo]
    The date stamp on the back reads three days ago.
    Whoever left it wanted you to find it.
    ~ setFlag("photo_examined", 1)
    -> END
* [Check the other drawers]
    Locked. All of them except this one.
    Someone wanted this to be found.
    -> END

=== talk_to_vera ===
~ setEmotion("vera_cross", "neutral")
~ triggerMonologue("empathy", 5, "She's nervous. Hands too still, like she's trying not to fidget.")
~ triggerMonologue("perception", 6, "She's been here a while. The coffee on the corner's gone cold.")

"Detective." She doesn't sit down. "I wasn't sure you'd come back tonight."

* [Ask what she knows]
    "Everything you've got."
    She looks at her hands. "He came by the office three nights ago. Wanted files. Payroll — six months back."
    "And you let him in."
    "I told him we were closed." A pause. "He knew my brother's name."
    ~ temp trusted = skillCheck("empathy", 7)
    {trusted:
        ~ setEmotion("vera_cross", "warm")
        ~ triggerMonologue("empathy", 7, "She didn't have a choice. She's been carrying that since.")
        "Did he get what he came for?"
        "I shredded the originals afterward. But he had a camera."
    - else:
        ~ setEmotion("vera_cross", "guarded")
        "Did he get the files?"
        "I don't know," she says. "I left before he finished."
    }
    -> vera_followup

* [DC 6 Empathy I know this is hard. Take your time.]
    ~ temp opened = skillCheck("empathy", 6)
    {opened:
        ~ setEmotion("vera_cross", "warm")
        ~ triggerMonologue("empathy", 6, "She needed someone to say that out loud. That's all it took.")
        Something in her shoulders drops. "He was scared," she says. "I've never seen him scared before."
        "The man who came for the files. Or whoever sent him?"
        "Whoever sent him." She slides a folded paper across the desk. A name. Two words.
    - else:
        ~ setEmotion("vera_cross", "cold")
        She gives you a careful look. "I'm fine."
        The wall goes back up. Whatever she was about to say, it's gone now.
        "You should go," she says. "I'll call if I think of anything."
        -> END
    }
    -> vera_followup

* [DC 7 Logic You've already talked to someone else about this.]
    ~ temp deduced = skillCheck("logic", 7)
    {deduced:
        ~ setEmotion("vera_cross", "surprised")
        ~ triggerMonologue("logic", 7, "The slight delay before every answer. She's rehearsed this version.")
        Her chin lifts. "How did you—"
        "You're giving me the version you agreed to give. Who told you what to say?"
        A long silence. "He said if you knew everything, it would put you in danger too."
    - else:
        ~ setEmotion("vera_cross", "guarded")
        "I talk to a lot of people," she says evenly. "That's my job."
        You've overplayed it. She's closed off now.
        -> END
    }
    -> vera_followup

= vera_followup
~ grantSkill("intuition")
~ temp saw_photo = getFlag("photo_examined")
* [Ask about the name on the paper]
    "Two words. Does that mean anything to you?"
    She shakes her head, but her eyes don't move from the middle distance.
    ~ setEmotion("vera_cross", "guarded")
    ~ triggerMonologue("perception", 5, "She's lying. Not well.")
    -> END
* {saw_photo} [Ask about the photograph in the desk]
    "The photo. Someone left it there for me. The X was drawn recently."
    She goes very still. "Where did you find that?"
    "Your desk. Top drawer."
    A long moment. She reaches into her bag and sets an envelope on the desk.
    "I took this before he could get back to it. I don't know why I kept it."
    ~ setEmotion("vera_cross", "distressed")
    ~ giveItem("photograph")
    -> END
* [Ask if she's safe]
    "Are you going to be all right?"
    "I've been all right through worse." She almost smiles. "Ask me again in a week."
    ~ setEmotion("vera_cross", "warm")
    -> END
