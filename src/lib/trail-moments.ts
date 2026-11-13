export type PreparedTrailMoment = {
  id: string;
  kind: 'verified-reference' | 'route-moment';
  title: string;
  context: string;
  prompt: string;
  image?: number;
  routeFraction: number;
  routeEnd?: boolean;
};

const trailheadImage = require('../../assets/trails/grand-prismatic/trailhead.jpg');
const overlookImage = require('../../assets/trails/grand-prismatic/overlook.jpg');

/** Prepared reference moments for the single fully supported prototype trail. */
export const grandPrismaticMoments: PreparedTrailMoment[] = [
  {
    id: 'fairy-falls-trailhead',
    kind: 'verified-reference',
    title: 'Fairy Falls trailhead',
    context: 'The approach begins near the Firehole River and the Fairy Falls parking area.',
    prompt: 'What did you notice as the walk began?',
    image: trailheadImage,
    routeFraction: 0.10,
  },
  {
    id: 'firehole-river-approach',
    kind: 'route-moment',
    title: 'Firehole River approach',
    context: 'The route leaves the trailhead and follows the approach toward the Grand Prismatic overlook.',
    prompt: 'What did you notice as the trail settled into its rhythm?',
    routeFraction: 0.34,
  },
  {
    id: 'overlook-approach',
    kind: 'route-moment',
    title: 'Overlook approach',
    context: 'The trail climbs toward the elevated view over Grand Prismatic Spring and Midway Geyser Basin.',
    prompt: 'What made you want to keep moving toward the view?',
    routeFraction: 0.54,
  },
  {
    id: 'grand-prismatic-overlook',
    kind: 'verified-reference',
    title: 'Grand Prismatic overlook',
    context: 'The trail climbs to the elevated view over Grand Prismatic Spring and Midway Geyser Basin.',
    prompt: 'What changed when the view opened up?',
    image: overlookImage,
    routeFraction: 1,
    routeEnd: true,
  },
];
