import { Accordion, AccordionSummary } from '$src/lib/components';
import { AccordionDetails, Grid, Stack, TextField, Typography, useEventCallback } from '@mui/material';
import { ChangeEvent, useDeferredValue, useState } from 'react';
import { itemImages } from '$src/lib/imageManifest';

export interface InventoryProps {
  itemInventoryLookup: Map<string, number>;
}

export const Input = ({
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
        onChange={handleInputChange}
        onBlur={zeroBlankFieldsOnBlur}
      />
    </Grid>
  );
}

const items = [
  'Basic ghostly ink',
  'Regular ghostly ink',
  'Greater ghostly ink',
  'Powerful ghostly ink',
  'Weak necroplasm',
  'Lesser necroplasm',
  'Greater necroplasm',
  'Powerful necroplasm',
  'Ectoplasm',
];

const Inventory: React.FC<InventoryProps> = ({
  itemInventoryLookup,
}) => {
  const [ search, setSearch ] = useState('');
  const deferredSearch = useDeferredValue(search);

  const handleInputChange = useEventCallback((key: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Checking if value is an integer
    if (value.match(/^[0-9]+$/) === null) {
      itemInventoryLookup.set(key, 0); 
      return;
    }
    
    const intValue = parseInt(value);
    itemInventoryLookup.set(key, intValue);    
  });

  return (
    <Accordion>
      <AccordionSummary>
        <Typography variant="h6">Inventory</Typography>
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
              map={itemInventoryLookup}
              search={deferredSearch}
              onChange={handleInputChange}
            />
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default Inventory;