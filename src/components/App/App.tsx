import { useState } from 'react';
import { Ritual, rituals } from '$src/classes';
import { Container, Grid } from '@mui/material';
import { CostTable, Documentation, Pricing, RitualConfig } from './components';
import { useMap } from '$src/lib/hooks';
import { mapFromJson, mapToJson } from '$src/lib/helpers';

export type MultiplyGlyphNames = 'Multiply I' | 'Multiply II' | 'Multiply III';

const App = () => {
  const [ ritual, setRitual ] = useState<Ritual>(rituals[0]);
  const [ ritualCount, setRitualCount ] = useState<number>(1);
  const [ ironmanMode, setIronmanMode ] = useState<boolean>(false);
  const [ noWaste, setNoWaste ] = useState<boolean>(false);
  const [ prerequisiteCapeGlyph, setPrerequisiteCapeGlyph ] = useState<MultiplyGlyphNames | 'none'>('none');

  const itemCostLookup = useMap<string, number>(() => {
    const mapData = localStorage.getItem('itemCostLookup') ?? '{}';
    return mapFromJson(mapData);
  }, (map) => {
    localStorage.setItem('itemCostLookup', mapToJson(map));
  });

  return (
    <Container style={{paddingTop: '3rem', paddingBottom: '3rem'}}>
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
            itemCostLookup={itemCostLookup}
            ritual={ritual}
            ritualCount={ritualCount}
            ironmanMode={ironmanMode}
            noWaste={noWaste}
            prerequisiteCapeGlyph={prerequisiteCapeGlyph}
          />
        </Grid>
        <Grid item xs={12}>
          <Documentation />
        </Grid>
        <Grid item xs={12}>
          <Pricing
            itemCostLookup={itemCostLookup}
          />
        </Grid>
      </Grid>
    </Container>
  )
}

export default App;