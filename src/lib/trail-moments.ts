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
