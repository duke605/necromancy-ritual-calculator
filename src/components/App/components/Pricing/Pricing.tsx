import { Accordion, AccordionSummary } from '$src/lib/components';
import { AccordionDetails, Button, Grid, Stack, TextField, Typography, useEventCallback } from '@mui/material';
import { itemImages } from '$src/lib/imageManifest';
import React, { ChangeEvent, useDeferredValue, useEffect, useState } from 'react';
import { getPriceForItems } from '$src/lib/wiki';

interface PricingProps {
  itemCostLookup: Map<string, number>;
}

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
  const [ localValue, setLocalValue ] = useState(`${value}`);

  useEffect(() => {
    setLocalValue(`${value}`);
  }, [value]);

  /**
   * Zeros the value when the field is blurred and is blank
   */
  const zeroBlankFieldsOnBlur = useEventCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (value !== '' && value.match(/^[0-9]+$/) !== null) {
      return;
    }

    setLocalValue('0');
  });

  /**
   * Sets the local value and calls the on change event
   */
  const handleInputChange = useEventCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    onChange(label, e);
  });

  return (
    <Grid item xs={4}>
      <TextField
        fullWidth
        style={{
          opacity: muted ? 1 : 0.1,
          pointerEvents: muted ? undefined : 'none',
        }}
        type="number"
        label={
          <Stack direction="row" spacing={1}>
            {label}
            <img src={itemImages[label]} alt={label} style={{height: '1.5rem', marginLeft: '14px', objectFit: 'contain'}} />
          </Stack>
        }
        value={localValue}
        onBlur={zeroBlankFieldsOnBlur}
        onChange={handleInputChange}
      />
    </Grid>
  );
}

const items = [
  'Weak necroplasm',
  'Lesser necroplasm',
  'Greater necroplasm',
  'Powerful necroplasm',
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
  'Ectoplasm',
  'Vial of water',
  'Ashes',
];

const Pricing: React.FC<PricingProps> = ({
  itemCostLookup,
}) => {
  const [ search, setSearch ] = useState('');
  const [ gettingPrices, setGettingPrices ] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const handleInputChange = useEventCallback((key: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Checking if value is an integer
    if (value.match(/^[0-9]+$/) === null) {
      itemCostLookup.set(key, 0); 
      return;
    }
    
    const intValue = parseInt(value);
    itemCostLookup.set(key, intValue);    
  });

  const getItemPrices = async () => {
    try {
      setGettingPrices(true);
      const prices = await getPriceForItems(...items);

      for (const [ key, value ] of prices) {
        itemCostLookup.set(key, value);
      }
    } finally {
      setGettingPrices(false);
    }
  }

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
              style={{margin: '1rem 0 1rem'}}
              label="Search items"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={4} alignContent="center" justifyItems="center">
            <Button disabled={gettingPrices} variant="contained" onClick={getItemPrices}>Get Prices</Button>
          </Grid>
          <Grid item xs={12} />
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