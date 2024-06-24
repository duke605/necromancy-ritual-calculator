import { useState } from 'react';
import { Ritual, rituals } from '$src/classes';
import { Container, Grid } from '@mui/material';
import { CostTable, Documentation, Inventory, Pricing, RitualConfig } from './components';
import { useMap } from '$src/lib/hooks';
import { mapFromJson, mapToJson } from '$src/lib/helpers';
import { Rasial } from './components/Rasial';

export type MultiplyGlyphNames = 'Multiply I' | 'Multiply II' | 'Multiply III';

const App = () => {
  const [ ritual, setRitual ] = useState<Ritual>(rituals[0]);
  const [ ritualCount, setRitualCount ] = useState<number>(1);
  const [ ironmanMode, setIronmanMode ] = useState<boolean>(false);
  const [ noWaste, setNoWaste ] = useState<boolean>(false);
  const [ prerequisiteCapeGlyph, setPrerequisiteCapeGlyph ] = useState<MultiplyGlyphNames | 'none'>('none');

  const itemCostLookup = useMap(() => {
    const mapData = localStorage.getItem('itemCostLookup') ?? '{}';
    const map = mapFromJson<number>(mapData);
    map.set('Basic ghostly ink', 3);
    map.set('Weak necroplasm', 3);

    return map;
  }, (map) => {
    localStorage.setItem('itemCostLookup', mapToJson(map));
  });
  const itemInventoryLookup = useMap<string, number>(() => {
    const mapData = localStorage.getItem('itemInventoryLookup') ?? '{}';
    return mapFromJson(mapData);
  }, (map) => {
    localStorage.setItem('itemInventoryLookup', mapToJson(map));
  });

  return (
    <Container style={{paddingTop: '3rem', paddingBottom: '3rem'}}>
      <Rasial />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RitualConfig
            ritual={ritual}
            ritualCount={ritualCount}
            ironmanMode={ironmanMode}
            noWaste={noWaste}
            prerequisiteCapeGlyph={prerequisiteCapeGlyph}
            onChangeRitual={setRitual}
            onChangeRitualCount={setRitualCount}
            onChangeIronmanMode={setIronmanMode}
            onChangeNoWaste={setNoWaste}
            onChangePrerequisiteCapeGlyph={setPrerequisiteCapeGlyph}
          />
        </Grid>
        <Grid item xs={12}>
          <CostTable
            ritual={ritual}
            ritualCount={ritualCount}
            ironmanMode={ironmanMode}
            noWaste={noWaste}
            prerequisiteCapeGlyph={prerequisiteCapeGlyph}
            itemCostLookup={itemCostLookup}
            itemInventoryLookup={itemInventoryLookup}
          />
        </Grid>
        <Grid item xs={12}>
          <Documentation />
          <Pricing itemCostLookup={itemCostLookup} />
          <Inventory itemInventoryLookup={itemInventoryLookup} />
        </Grid>
      </Grid>
    </Container>
  )
}

export default App;