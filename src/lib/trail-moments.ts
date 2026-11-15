export type PreparedTrailMoment = {
  id: string;
  kind: 'verified-reference' | 'route-moment';
  title: string;
  context: string;
  prompt: string;
  image?: number;
  images?: number[];
  routeFraction: number;
  routeEnd?: boolean;
};

const trailheadImage = require('../../assets/trails/grand-prismatic/trailhead.jpg');
const fireholeBridgeImage = require('../../assets/trails/grand-prismatic/firehole-bridge.jpg');
const midwayImage = require('../../assets/trails/grand-prismatic/midway.jpg');
const twinButtesViewImage = require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg');
const springImage = require('../../assets/trails/grand-prismatic/spring.jpg');
const grandPrismaticSpringImage = require('../../assets/trails/grand-prismatic/grand-prismatic-spring.jpg');
const overlookImage = require('../../assets/trails/grand-prismatic/overlook.jpg');

/** Prepared reference moments for the single fully supported prototype trail. */
export const grandPrismaticMoments: PreparedTrailMoment[] = [
  {
    id: 'fairy-falls-trailhead',
    kind: 'verified-reference',
    title: 'Fairy Falls trailhead',
    context: 'The approach begins near the Firehole River and the Fairy Falls parking area.',
    prompt: 'At the Fairy Falls trailhead, what did you notice first?',
    image: trailheadImage,
    images: [trailheadImage, fireholeBridgeImage],
    routeFraction: 0.10,
  },
  {
    id: 'firehole-river-approach',
    kind: 'route-moment',
    title: 'Firehole River approach',
    context: 'The route leaves the trailhead and follows the approach toward the Grand Prismatic overlook.',
    prompt: 'As the Firehole River came alongside the trail, what stood out?',
    image: fireholeBridgeImage,
    images: [fireholeBridgeImage, midwayImage],
    routeFraction: 0.34,
  },
  {
    id: 'overlook-approach',
    kind: 'route-moment',
    title: 'Overlook approach',
    context: 'The trail climbs toward the elevated view over Grand Prismatic Spring and Midway Geyser Basin.',
    prompt: 'On the climb toward the overlook, what changed around you?',
    image: twinButtesViewImage,
    images: [twinButtesViewImage, springImage],
    routeFraction: 0.54,
  },
  {
    id: 'grand-prismatic-overlook',
    kind: 'verified-reference',
    title: 'Grand Prismatic overlook',
    context: 'The trail climbs to the elevated view over Grand Prismatic Spring and Midway Geyser Basin.',
    prompt: 'When Grand Prismatic first came into view, what pulled your attention?',
    image: overlookImage,
    images: [grandPrismaticSpringImage, overlookImage],
    routeFraction: 1,
    routeEnd: true,
  },
];

const noticingPrompts: { match: RegExp; prompts: string[] }[] = [
  { match: /color|colour|orange|yellow|green|blue/, prompts: [
    'What color did you notice first?',
    'Where did the colors change as the trail moved beside the water?',
    'What shifted from green to orange, yellow, or blue as you climbed?',
    'Which color or combination stayed with you beneath the view?',
  ] },
  { match: /sound|hear|quiet|echo|rhythm/, prompts: [
    'What sound reached you first at the trailhead?',
    'How did the river sound change as you came alongside it?',
    'As the trail climbed, what could you hear around you?',
    'What sound, or quiet, stayed with you at the overlook?',
  ] },
  { match: /wind|open|openness|wide|horizon|space/, prompts: [
    'What did the trail keep out of view at first?',
    'How did the river change the feel of the approach?',
    'Where did the landscape start to open up?',
    'What felt different when you reached the wide view?',
  ] },
  { match: /scale|distance|vast|mountain|perspective/, prompts: [
    'How large did the landscape feel from the trailhead?',
    'What helped you sense the scale as you came alongside the river?',
    'How did the climb change your sense of distance?',
    'What finally gave the spring its scale?',
  ] },
  { match: /texture|surface|rough|smooth|rock|ground/, prompts: [
    'What texture caught your attention first?',
    'What changed underfoot near the river?',
    'What textures shifted as the trail climbed?',
    'What surface or detail stayed with you at the overlook?',
  ] },
  { match: /light|glow|shadow|sun/, prompts: [
    'Where did the light first catch your attention?',
    'How did the light move across the trail?',
    'What changed as the view opened up?',
    'What glow or shadow stayed with you?',
  ] },
  { match: /water|river|pool|lake|shore/, prompts: [
    'What did the water make you notice first?',
    'How did being near the river change the walk?',
    'What movement did you notice in the water or landscape?',
    'What stayed with you about the spring?',
  ] },
  { match: /movement|motion|flow|steam|drift|current/, prompts: [
    'What movement caught your attention first?',
    'How did the water move as the trail came alongside it?',
    'What changed as you climbed toward the overlook?',
    'What movement made the view feel alive?',
  ] },
  { match: /change|shift|transition/, prompts: [
    'What changed as you began the walk?',
    'What shifted when the river came alongside you?',
    'What changed as the trail climbed?',
    'What changed when the view opened up?',
  ] },
];

export function getNoticingPrompt(moment: PreparedTrailMoment, focus?: string) {
  const normalized = focus?.toLowerCase() ?? '';
  const matchedPrompts = noticingPrompts.find(({ match }) => match.test(normalized))?.prompts;
  if (!matchedPrompts) return moment.prompt;
  return matchedPrompts[grandPrismaticMoments.findIndex((candidate) => candidate.id === moment.id)] ?? moment.prompt;
}
