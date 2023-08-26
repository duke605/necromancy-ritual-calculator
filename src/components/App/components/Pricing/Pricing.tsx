import { Accordion, AccordionSummary } from '$src/lib/components';
import { AccordionDetails, Grid, Stack, TextField, Typography, useEventCallback } from '@mui/material';
import React, { ChangeEvent, useDeferredValue, useMemo, useState } from 'react';
import { itemImages } from '$src/lib/imageManifest';

export interface PricingProps {
  itemCostLookup: Map<string, number>;
}

const coinIncrements = [1, 2, 3, 4, 5, 25, 100, 250, 1000, 10000];

const Input = ({
    label,
    map,
    search,
    onChange,
}: {
  label: string;
  map: Map<string, number>;
  search: string;
  onChange: (key: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => {
  const muted = label.toLowerCase().includes(search.toLowerCase().trim());
  const value = map.get(label) ?? 0;
  const coinImage = useMemo(() => {
    let highest = 0;
    for (const coinIncrement of coinIncrements) {
      if (value >= coinIncrement) {
        highest = coinIncrement;
        continue;
      }

      break;
    }

    return itemImages[highest === 0 ? 'Volcanic ash' : `Coins_${highest}`];
  }, [value]);

  return (
    <Grid item xs={4}>
      <TextField
        fullWidth
        style={{
          opacity: muted ? 1 : 0.1,
          pointerEvents: muted ? undefined : 'none',
        }}
        type="number"
        InputProps={{
          startAdornment: <img src={coinImage} style={{width: '1rem', marginRight: '14px', objectFit: 'scale-down'}} />,
        }}
        label={
          <Stack direction="row" spacing={1}>
            {label}
            <img src={itemImages[label]} alt={label} style={{height: '1.5rem', marginLeft: '14px', objectFit: 'contain'}} />
          </Stack>
        }
        defaultValue={value}
        onChange={e => onChange(label, e)}
      />
    </Grid>
  );
}

const items = [
  'Basic ghostly ink',
  'Regular ghostly ink',
  'Greater ghostly ink',
  'Powerful ghostly ink',
  'Pure essence',
  'Impure essence',
  'Bones',
  'Big bones',
  'Baby dragon bones',
  'Wyvern bones',
  'Broken memento',
  'Fragile memento',
  'Dragon bones',
  'Dagannoth bones',
  'Airut bones',
  'Ourg bones',
  'Hardened dragon bones',
  'Dragonkin bones',
  'Spirit memento',
  'Dinosaur bones',
  'Frost dragon bones',
  'Reinforced dragon bones',
  'Robust memento',
  'Powerful memento',
  'Spider silk hood',
  'Spider silk robe top',
  'Spider silk robe bottom',
  'Spider silk gloves',
  'Spider silk boots',
  'Thread',
  'Mystic hat',
  'Mystic robe top',
  'Mystic robe bottom',
  'Mystic gloves',
  'Mystic boots',
  'Springsheared wool',
  'Summerdown wool',
  'Fallfaced wool',
  'Winterwold wool',
  'Hood of subjugation',
  'Garb of subjugation',
  'Gown of subjugation',
  'Gloves of subjugation',
  'Boots of subjugation',
  'Algarum thread',
  'Greater unensouled bar',
  'Unensouled bar',
  'Lesser unensouled bar',
  'Weak necroplasm',
  'Ectoplasm',
];

const Pricing: React.FC<PricingProps> = ({
  itemCostLookup,
}) => {
  const [ search, setSearch ] = useState('');
  const deferredSearch = useDeferredValue(search);

  const handleInputChange = useEventCallback((key: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Checking if value is an integer
    if (value.match(/^[0-9]+$/) === null) {
      return;
    }
    
    const intValue = parseInt(value);
    itemCostLookup.set(key, intValue);    
  });

  return (
    <Accordion>
      <AccordionSummary>
        <Typography variant="h6">Pricing</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              fullWidth
              style={{margin: '1rem 0 2rem'}}
              label="Search items"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={8} />
          {items.map(item => (
            <Input
              key={item}
              label={item}
              map={itemCostLookup}
              search={deferredSearch}
              onChange={handleInputChange}
            />
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default Pricing;