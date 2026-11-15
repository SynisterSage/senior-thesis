export type NoticingFocus = {
  id: string;
  title: string;
  prompt: string;
  focus: string;
  description: string;
  examples: string[];
  image: number;
};

export const noticingFocuses: NoticingFocus[] = [
  { id: 'color', title: 'Follow the color', prompt: 'Notice how one color changes along the trail.', focus: 'Follow one color and notice how it changes along the trail.', description: 'Choose one color and let it guide your attention as the trail moves through different places.', examples: ['Where does the color first appear?', 'How does it change in shade, texture, or scale?'], image: require('../../assets/lenses/follow-color.jpg') },
  { id: 'water', title: 'Listen for water', prompt: 'Follow sound before you look for its source.', focus: 'Listen for water before looking for where it comes from.', description: 'Let the sound of water lead you. Notice how it changes before you find the place it is coming from.', examples: ['What reaches you before the water comes into view?', 'How does the sound change as you move?'], image: require('../../assets/lenses/listen-water.jpg') },
  { id: 'edge', title: 'Find the edge', prompt: 'Look for where water, meadow, and forest meet.', focus: 'Notice the edges where two kinds of landscape meet.', description: 'Look for transitions: the places where water, meadow, forest, or light give way to each other.', examples: ['What two things meet here?', 'What changes as you cross from one side to the other?'], image: require('../../assets/trails/catalog/storm-point.jpg') },
  { id: 'scale', title: 'Look up', prompt: 'Pay attention to sky, distance, and the shape of the land.', focus: 'Look up and notice the scale of the landscape around you.', description: 'Lift your attention beyond the path and notice how the sky, distance, and land shape the walk.', examples: ['What feels larger when you look up?', 'How does the view change your sense of where you are?'], image: require('../../assets/trails/catalog/taggart-lake.jpg') },
];

export function getNoticingFocus(id?: string) {
  return noticingFocuses.find((focus) => focus.id === id);
}
