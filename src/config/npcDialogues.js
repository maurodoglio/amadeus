/**
 * NPC dialogue data for each character across levels.
 */

export const NPC_DIALOGUES = {
  haydn: {
    name: 'Haydn',
    texture: 'npc_haydn',
    firstMeeting: [
      { name: 'Haydn', portrait: 'npc_haydn', text: 'Ah, young Wolfgang! I heard you were coming to Vienna.' },
      { name: 'Haydn', portrait: 'npc_haydn', text: 'Let me teach you something: jump on enemies to defeat them! Time your jumps carefully.' },
      { name: 'Haydn', portrait: 'npc_haydn', text: 'Collect those floating music notes for points. Build combos by collecting them quickly!' },
      { name: 'Haydn', portrait: 'npc_haydn', text: 'And keep an eye out for hidden sheet music pages — they are well worth finding.' },
      { name: 'Mozart', portrait: 'mozart', text: 'Thank you, Herr Haydn! I will remember your advice.' }
    ],
    repeat: [
      { name: 'Haydn', portrait: 'npc_haydn', text: 'Remember: jump on enemies, collect notes, and look for secrets above!' }
    ]
  },

  salieri: {
    name: 'Salieri',
    texture: 'npc_salieri',
    firstMeeting: [
      { name: 'Salieri', portrait: 'npc_salieri', text: 'So, you are the famous Mozart... I expected someone taller.' },
      { name: 'Mozart', portrait: 'mozart', text: 'And you must be Salieri. They say you are quite the composer yourself.' },
      { name: 'Salieri', portrait: 'npc_salieri', text: 'Hmph. I was going to challenge you, but... this palace is dangerous for both of us.' },
      { name: 'Salieri', portrait: 'npc_salieri', text: 'The guards here attack in patterns. Watch their movements before you jump!' },
      { name: 'Salieri', portrait: 'npc_salieri', text: 'If we both survive this place, perhaps we can be... allies.' },
      { name: 'Mozart', portrait: 'mozart', text: 'I would like that, Salieri. Music is better with friends!' }
    ],
    repeat: [
      { name: 'Salieri', portrait: 'npc_salieri', text: 'Watch the enemy patterns carefully. They repeat — use that to your advantage.' }
    ]
  },

  nannerlNPC: {
    name: 'Nannerl',
    texture: 'npc_nannerl',
    firstMeeting: [
      { name: 'Nannerl', portrait: 'npc_nannerl', text: 'Wolfgang! I followed you here. You cannot have all the adventure!' },
      { name: 'Mozart', portrait: 'mozart', text: 'Nannerl! It is dangerous here!' },
      { name: 'Nannerl', portrait: 'npc_nannerl', text: 'I know, but I found something useful. Listen carefully...' },
      { name: 'Nannerl', portrait: 'npc_nannerl', text: 'The instruments you collect can help you! Each one grants a different power when you need it most.' },
      { name: 'Nannerl', portrait: 'npc_nannerl', text: 'Also, try reaching the very top of each level. Secret sheet music pages hide up there!' },
      { name: 'Mozart', portrait: 'mozart', text: 'You are the best sister anyone could ask for!' }
    ],
    repeat: [
      { name: 'Nannerl', portrait: 'npc_nannerl', text: 'Remember — instruments give powers, and secrets hide up high! Now go show them what a Mozart can do!' }
    ]
  },

  beethoven: {
    name: 'Beethoven',
    texture: 'npc_beethoven',
    firstMeeting: [
      { name: '???', portrait: 'npc_beethoven', text: '...' },
      { name: 'Mozart', portrait: 'mozart', text: 'Who are you? How did you get up here?' },
      { name: 'Young Beethoven', portrait: 'npc_beethoven', text: 'My name is Ludwig. Ludwig van Beethoven. I... I came to hear you play.' },
      { name: 'Mozart', portrait: 'mozart', text: 'You climbed all the way to the Sky Cathedral just to hear music?' },
      { name: 'Young Beethoven', portrait: 'npc_beethoven', text: 'Music is worth any climb. One day, I will compose symphonies that shake the heavens!' },
      { name: 'Mozart', portrait: 'mozart', text: 'Ha! I believe you will, Ludwig. Here — take this advice from me to you...' },
      { name: 'Mozart', portrait: 'mozart', text: 'Never let anyone silence your music. The world needs every note you have to give.' },
      { name: 'Young Beethoven', portrait: 'npc_beethoven', text: 'I will remember that, Herr Mozart. Always.' }
    ],
    repeat: [
      { name: 'Young Beethoven', portrait: 'npc_beethoven', text: 'One day, the whole world will hear my music. Thank you for inspiring me, Mozart.' }
    ]
  }
};
