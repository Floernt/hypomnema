---
title: Objection and verification
description: Two annotation gestures for reading against the text.
sidebar:
  order: 2
---

:::note
Available from version 0.5.0.
:::

:::caution[Draft — the author will rewrite this section]
“The idea” and “An example from a real reading” are a draft.
:::

## The idea

Two reactions come back in almost every critical reading: "I disagree" and "I need to check this". Each deserves its own gesture, because each calls for a different follow-up. An objection is an argument to develop; a verification is a task to close. Giving them a hotkey makes the reaction cheap enough to be written down on the spot instead of postponed.

## An example from a real reading

In *Why we forget what we read*, the article claims that most of what we read is forgotten within the hour. *To verify* asks "Verify what?", the answer is "the source of the forgetting curve figures", and the comment reads "Verify the source of the forgetting curve figures". A few paragraphs later, the claim that annotating is enough to remember gets an *Objection*: "Objection: annotating is not rereading."

## The setting

Create two [Annotation](/concepts/annotation/) gestures in *Settings → Hypomnema → Gestures*, and turn on *Command* for both.

| Name | Category | Starting text |
|---|---|---|
| Objection | `#objection` | `Objection: {{cursor}}` |
| To verify | `#to-verify` | `Verify {{VALUE:what?}}` |

The `objection` and `to-verify` categories must exist in the *Categories* section. Then give each command a hotkey in *Settings → Hotkeys*, for instance Ctrl+Alt+O and Ctrl+Alt+V.

## Variants

**A verification list.** An [Extraction](/concepts/extraction/) with scope *Whole vault*, the category filter `to-verify` and the Kanban format gives a single board of everything left to check.

**Ask for the category.** A single gesture with category *Ask each time* (`"ask"`) and an empty *Starting text* replaces several gestures when you prefer to choose at each comment.

**Answering the objection.** Reply to the objection in its thread when you have the answer, instead of editing the comment: the thread keeps the trace of both moments of the reading.
