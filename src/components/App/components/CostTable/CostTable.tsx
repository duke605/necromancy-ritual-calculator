import React, { useMemo } from 'react';
import { Glyph, Ritual, RitualModifier, rituals } from '$src/classes';
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from '@mui/material';
import { ucfirst } from '$src/lib/helpers';
import { itemImages } from '$src/lib/imageManifest';
import { MultiplyGlyphNames } from '../..';
import inks from '$data/inks.json';
import glyphData from '$data/glyphs.json';
import styles from './CostTable.module.css';

export interface CostTableProps {
  ritual: Ritual;
  ritualCount: number;
  ironmanMode: boolean;
  noWaste: boolean;
  prerequisiteCapeGlyph: MultiplyGlyphNames | 'none';
  itemCostLookup: Map<string, number>;
  itemInventoryLookup: Map<string, number>;
}

const necroplasmTiers = [
  'Lesser necroplasm',
  'Greater necroplasm',
  'Powerful necroplasm',
] as const;

const sumInputAndOutputs = (
  ritual: Ritual,
  ritualCount: number,
  inputs: Map<string, number>,
  outputs: Map<string, number>,
  ironmanMode: boolean,
  inventory: Map<string, number>,
  omitNecroplasmFromOutput: boolean = false,
) => {
  const cost = ritual.getInputs(ritualCount);
  const takeFromInventory = (name: string, amount: number) => {
    const amountInInventory = inventory.get(name) ?? 0;
    const outstandingAmount = Math.max(amount - amountInInventory, 0);
    const inventoryLeft = Math.max(amountInInventory - amount, 0);

    const currentAmount = inputs.get(name) ?? 0;
    inventory.set(name, inventoryLeft);
    inputs.set(name, currentAmount + outstandingAmount);

    return outstandingAmount;
  }

  // Tallying item inputs
  for (const [ name, amount ] of Object.entries(cost.items)) {
    if (amount === 0) continue;

    takeFromInventory(name, amount);
  }

  // Tallying ink (and direct necroplasm inputs if ironman mode)
  for (const [ ink, amount ] of Object.entries(cost.inks)) {
    if (amount === 0) continue;
    
    const { name, necroplasmType } = inks[ink as keyof typeof inks] as {name: string, necroplasmType?: string};
    const outstandingAmount = takeFromInventory(name, amount);

    if (!ironmanMode || !necroplasmType) continue;

    // Adding ashes and vials of water to inputs
    takeFromInventory('Vial of water', outstandingAmount);
    takeFromInventory('Ashes', outstandingAmount);

    // Adding necroplasm to inputs
    const necroplasm = ucfirst(necroplasmType) + ' necroplasm';
    takeFromInventory(necroplasm, outstandingAmount * 20);
  }

  // Tallying outputs
  for (const { name, amount } of ritual.getOutputs(ritualCount)) {
    if (amount === 0) continue;
    if (omitNecroplasmFromOutput && name.includes('necroplasm')) continue;

    const n = outputs.get(name) ?? 0;
    outputs.set(name, n + amount);
  }
}

const TotalRow = ({
  name,
  value,
  colSpan = 1,
}: {
  name: React.ReactNode,
  value: React.ReactNode,
  colSpan?: number,
}) => {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight="bold">{name}</Typography>  
      </TableCell>
      <TableCell colSpan={colSpan}>
        <Typography textAlign="right" variant="body2" fontWeight="bold">{value}</Typography>
      </TableCell>
    </TableRow>
  );
}

const CostTable: React.FC<CostTableProps> = ({
  ritual,
  ritualCount,
  ironmanMode,
  noWaste,
  prerequisiteCapeGlyph,
  itemCostLookup,
  itemInventoryLookup,
}) => {
  const { inputs, outputs, ritualsToPerform, totalInputPrice, totalOutputPrice } = useMemo(() => {
    const inputs = new Map<string, number>();
    const outputs = new Map<string, number>();
    const ritualsToPerform = [{ritual, count: ritualCount}];
    const inventory = new Map(itemInventoryLookup);

    sumInputAndOutputs(ritual, ritualCount, inputs, outputs, ironmanMode, inventory);

    // Calculating cost to make necroplasm if ironman mode
    if (ironmanMode) {
      for (const necroplasm of [...necroplasmTiers].reverse()) {
        let ritualToMakeNecroplasm = rituals.find(r => r.name === necroplasm);
        const necroplasmNeeded = inputs.get(necroplasm) ?? 0;
        if (!ritualToMakeNecroplasm || necroplasmNeeded === 0) continue;
        const modifiersToAdd: RitualModifier[] = [];

        // Adding cape if not none
        if (prerequisiteCapeGlyph !== 'none') {
          const capeGlyph = glyphData[prerequisiteCapeGlyph] as Omit<Glyph, 'name' | 'amount'>;
          capeGlyph && modifiersToAdd.push({
            id: 'cape',
            duration: capeGlyph.duration,
            soulAttraction: capeGlyph.soulAttraction,
            multiplier: capeGlyph.multiply,
          });
        }

        // Adding grimoire if enabled
        const grimoireModifier = ritual.getModifier('underworldGrimoire');
        if (grimoireModifier) modifiersToAdd.push(grimoireModifier);
        ritualToMakeNecroplasm = ritualToMakeNecroplasm.putModifiers(...modifiersToAdd);

        // Looping until will find the number of rituals we need to perform
        let n = 0;
        while(ritualToMakeNecroplasm
          .getOutputs(++n)
          .find(({ name }) => name === necroplasm)!.amount <= necroplasmNeeded
        );

        // Setting n to the nearest common denominator
        if (noWaste) {
          const cd = ritualToMakeNecroplasm.getGoldenRatio();
          n = Math.ceil(n / cd) * cd;
        }

        // Calculating excess necroplasm
        const necroplasmMade = ritualToMakeNecroplasm.getOutputs(n).find(({ name }) => name === necroplasm)!.amount;
        const excessNecroplasm = necroplasmMade - necroplasmNeeded;
        if (excessNecroplasm > 0) {
          const currentNecroplasmOutput = outputs.get(necroplasm) ?? 0;
          outputs.set(necroplasm, excessNecroplasm + currentNecroplasmOutput);
        }

        ritualsToPerform.push({ritual: ritualToMakeNecroplasm, count: n});
        sumInputAndOutputs(ritualToMakeNecroplasm, n, inputs, outputs, true, inventory, true);
      }      
    }

    const inputRows = Array.from(inputs.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(([, amount ]) => amount > 0)
      .map(([ name, amount ]) => ({
        id: name,
        name: (
          <Typography variant="body2">
            <img src={itemImages[name]} style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain', width: '24px', height: '24px'}} alt={name} />
            {name}
          </Typography>
        ),
        amount: <Typography variant="body2" textAlign="right">{amount.toLocaleString()}</Typography>,
        price: <Typography variant="body2" textAlign="right">{((itemCostLookup.get(name) ?? 0) * amount).toLocaleString()}</Typography>,
      }));
    const outputRows = Array.from(outputs.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .filter(([, amount ]) => amount > 0)
    .map(([ name, amount ]) => ({
      id: name,
      name: (
        <Typography variant="body2">
          <img src={itemImages[name]} style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain', width: '24px', height: '24px'}} alt={name} />
          {name}
        </Typography>
      ),
      amount: <Typography variant="body2" textAlign="right">{amount.toLocaleString()}</Typography>,
      price: <Typography variant="body2" textAlign="right">{((itemCostLookup.get(name) ?? 0) * amount).toLocaleString()}</Typography>,
    }));

    return {
      inputs: inputRows,
      outputs: outputRows,
      ritualsToPerform: ritualsToPerform.reverse(),
      totalInputPrice: Array.from(inputs.entries()).reduce((acc, [ item, amount ]) => acc + ((itemCostLookup.get(item) ?? 0) * amount), 0),
      totalOutputPrice: Array.from(outputs.entries()).reduce((acc, [ item, amount ]) => acc + ((itemCostLookup.get(item) ?? 0) * amount), 0),
    };
  }, [ritual, ritualCount, ironmanMode, noWaste, prerequisiteCapeGlyph, itemCostLookup, itemInventoryLookup]);
  const duration = useMemo(() => {
    let totalSeconds = ritualsToPerform.reduce((acc, { ritual, count }) => acc + (ritual.getDuration() * count), 0);
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    totalSeconds -= 3600 * (hours = Math.floor(totalSeconds / 3600));
    totalSeconds -= 60 * (minutes = Math.floor(totalSeconds / 60));
    seconds = Math.ceil(totalSeconds);
    
    return [hours, minutes, seconds].map(n => `${n}`.padStart(2, '0')).join(':');
  }, [ritualsToPerform, ironmanMode]);
  const totalRituals = ritualsToPerform.reduce((acc, { count }) => acc + count, 0);
  const totalExperience = ritualsToPerform.reduce((acc, { ritual, count }) => acc + (ritual.experience * count), 0);
  const totalDisturbanceChances = ritualsToPerform.reduce((acc, { ritual, count }) => acc + ritual.disturbanceChances * count, 0);

  return (
    <Grid spacing={3} container>
      <Grid item xs={12} margin="0 auto">
        <Typography variant="h6">
          Rituals to Perform:
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="body1">Ritual</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Count</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ritualsToPerform.map(({ ritual, count }) =>
                <TableRow key={ritual.name} className={styles.lastRow}>
                  <TableCell>
                    <Typography variant="body2">{ritual.name}</Typography>  
                  </TableCell>
                  <TableCell>
                    <Typography textAlign="right" variant="body2">{count}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TotalRow
                name="Total Rituals"
                value={totalRituals.toLocaleString()}
              />
              <TotalRow
                name="Total Duration"
                value={duration}
              />
              <TotalRow
                name="Total Experience (Excluding Disturbances)"
                value={totalExperience.toLocaleString()}
              />
              <TotalRow
                name="Total Disturbance Chances"
                value={totalDisturbanceChances.toLocaleString()}
              />
              <TotalRow
                name="Total Profit & Loss"
                value={(totalOutputPrice - totalInputPrice).toLocaleString()}
              />
            </TableFooter>
          </Table>
        </TableContainer>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="h6">
          Inputs:
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="100%">
                  <Typography variant="body1">Item</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Quantity</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Price</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inputs.map((row) =>
                <TableRow key={row.id} className={styles.lastRow}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.price}</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TotalRow
                name="Total Input Price"
                value={totalInputPrice.toLocaleString()}
                colSpan={2}
              />
            </TableFooter>
          </Table>
        </TableContainer>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="h6">
          Outputs:
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="100%">
                  <Typography variant="body1">Item</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Quantity</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Price</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outputs.map((row) =>
                <TableRow key={row.id} className={styles.lastRow}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.price}</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TotalRow
                name="Total Output Price"
                value={totalOutputPrice.toLocaleString()}
                colSpan={2}
              />
            </TableFooter>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export default CostTable;