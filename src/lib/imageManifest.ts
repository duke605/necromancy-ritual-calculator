import imgAlgarumThread from '$assets/algarum_thread.webp';
import imgPureEssence from '$assets/pure_essence.webp';
import imgSoul from '$assets/soul_active.webp';

import imgGreaterUnensouledBar from '$assets/greater_unensouled_bar.webp';

import imgBootsOfSubjugation from '$assets/boots_of_subjugation.webp';
import imgGlovesOfSubjugation from '$assets/gloves_of_subjugation.webp';
import imgHoodOfSubjugation from '$assets/hood_of_subjugation.webp';
import imgGarbOfSubjugation from '$assets/garb_of_subjugation.webp';
import imgGownOfSubjugation from '$assets/gown_of_subjugation.webp';

import imgWeakNecroplasm from '$assets/weak_necroplasm.webp';
import imgLesserNecroplasm from '$assets/lesser_necroplasm.webp';
import imgGreaterNecroplasm from '$assets/greater_necroplasm.webp';
import imgPowerfulNecroplasm from '$assets/powerful_necroplasm.webp';

import imgBones from '$assets/bones.webp';
import imgBigBones from '$assets/big_bones.webp';
import imgBabyDragonBones from '$assets/baby_dragon_bones.webp';
import imgWyvernBones from '$assets/wyvern_bones.webp';
import imgBrokenMemento from '$assets/broken_memento.webp';
import imgFragileMemento from '$assets/fragile_memento.webp';

import imgDragonBones from '$assets/dragon_bones.webp';
import imgDagannothBones from '$assets/dagannoth_bones.webp';
import imgAirutBones from '$assets/airut_bones.webp';
import imgOurgBones from '$assets/ourg_bones.webp';
import imgHardenedDragonBones from '$assets/hardened_dragon_bones.webp';
import imgDragonkinBones from '$assets/dragonkin_bones.webp';
import imgSpiritMemento from '$assets/spirit_memento.webp';

import imgDinosaurBones from '$assets/dinosaur_bones.webp';
import imgFrostDragonBones from '$assets/frost_dragon_bones.webp';
import imgReinforcedDragonBones  from '$assets/reinforced_dragon_bones.webp';
import imgRobustMemnento  from '$assets/robust_memento.webp';
import imgPowerfulMemnento from '$assets/powerful_memento.webp';

export const itemImages: Record<string, string> = new Proxy({
  'algarum_thread': imgAlgarumThread,
  'pure_essence': imgPureEssence,
  'soul': imgSoul,

  'greater_unensouled_bar': imgGreaterUnensouledBar,
  
  'boots_of_subjugation': imgBootsOfSubjugation,
  'gloves_of_subjugation': imgGlovesOfSubjugation,
  'hood_of_subjugation': imgHoodOfSubjugation,
  'garb_of_subjugation': imgGarbOfSubjugation,
  'gown_of_subjugation': imgGownOfSubjugation,
  
  'weak_necroplasm': imgWeakNecroplasm,
  'lesser_necroplasm': imgLesserNecroplasm,
  'greater_necroplasm': imgGreaterNecroplasm,
  'powerful_necroplasm': imgPowerfulNecroplasm,

  'bones': imgBones,
  'big_bones': imgBigBones,
  'baby_dragon_bones': imgBabyDragonBones,
  'wyvern_bones': imgWyvernBones,
  'broken_memento': imgBrokenMemento,
  'fragile_memento': imgFragileMemento,

  'dragon_bones': imgDragonBones,
  'dagannoth_bones': imgDagannothBones,
  'airut_bones': imgAirutBones,
  'ourg_bones': imgOurgBones,
  'hardened_dragon_bones': imgHardenedDragonBones,
  'dragonkin_bones': imgDragonkinBones,
  'spirit_memento': imgSpiritMemento,

  'dinosaur_bones': imgDinosaurBones,
  'frost_dragon_bones': imgFrostDragonBones,
  'reinforced_dragon_bones': imgReinforcedDragonBones,
  'robust_memento': imgRobustMemnento,
  'powerful_memento': imgPowerfulMemnento,
}, {
  get(target, prop): string {
    if (typeof prop !== 'string') return '';
    const slug = prop.toLowerCase().replace(/ /g, '_').trim();

    if (slug in target) {
      return target[slug as keyof typeof target];
    }

    return `https://runescape.wiki/images/${prop.replace(/ /g, '_').trim()}.png?1118f`;
  }
});