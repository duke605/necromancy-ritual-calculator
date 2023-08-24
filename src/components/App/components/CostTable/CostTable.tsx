import { Ritual, RitualModifier, rituals } from '$src/classes';
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import inks from '$data/inks.json';
import { ucfirst } from '$src/lib/helpers';
import { itemImages } from '$src/lib/imageManifest';
import styles from './CostTable.module.css';

export interface CostTableProps {
  ritual: Ritual;
  ritualCount: number;
  ironmanMode: boolean;
  noWaste: boolean;
}

const sumInputAndOutputs = (
  ritual: Ritual,
  ritualCount: number,
  inputs: Map<string, number>,
  outputs: Map<string, number>,
  ironmanMode: boolean,
  omitNecroplasmFromOutput: boolean = false,
) => {
  const cost = ritual.getCost(ritualCount);

  // Tallying item inputs
  for (const [ name, amount ] of Object.entries(cost.items)) {
    if (amount === 0) continue;

    const n = inputs.get(name) ?? 0;
    inputs.set(name, n + amount);
  }

  // Tallying ink (and direct necroplasm inputs if ironman mode)
  for (const [ ink, amount ] of Object.entries(cost.inks)) {
    if (amount === 0) continue;
    
    const { name, necroplasmType } = inks[ink as keyof typeof inks] as {name: string, necroplasmType?: string};
    
    let n = inputs.get(name) ?? 0;
    inputs.set(name, n + amount);

    if (!ironmanMode || !necroplasmType) continue;
    const necroplasm = ucfirst(necroplasmType) + ' necroplasm';
    n = inputs.get(necroplasm) ?? 0;
    inputs.set(necroplasm, n + (amount * 20));
  }

  // Tallying outputs
  for (const { name, amount } of ritual.getOutputs(ritualCount)) {
    if (amount === 0) continue;
    if (omitNecroplasmFromOutput && name.includes('necroplasm')) continue;

    const n = outputs.get(name) ?? 0;
    outputs.set(name, n + amount);
  }
}

const necroplasmTiers = [
  'Lesser necroplasm',
  'Greater necroplasm',
  'Powerful necroplasm',
] as const;

const CostTable: React.FC<CostTableProps> = ({
  ritual,
  ritualCount,
  ironmanMode,
  noWaste,
}) => {
  const { inputs, outputs } = useMemo(() => {
    const inputs = new Map<string, number>();
    const outputs = new Map<string, number>();

    sumInputAndOutputs(ritual, ritualCount, inputs, outputs, ironmanMode);

    // Calculating cost to make necroplasm if ironman mode
    if (ironmanMode) {
      for (const necroplasm of [...necroplasmTiers].reverse()) {
        let ritualToMakeNecroplasm = rituals.find(r => r.name === necroplasm);
        const necroplasmNeeded = inputs.get(necroplasm) ?? 0;
        if (!ritualToMakeNecroplasm || necroplasmNeeded === 0) continue;

        // Adding tome to the ritual if it's on the ritual we're preforming
        const modifiersToAdd: RitualModifier[] = [{
          id: 'cape',
          multiplier: 60,        
        }];
        const tomeModifier = ritual.getModifier('tomeOfUm');
        if (tomeModifier) modifiersToAdd.push(tomeModifier);
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
        
        sumInputAndOutputs(ritualToMakeNecroplasm, n, inputs, outputs, true, true);
      }      
    }

    const inputRows = Array.from(inputs.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ name, amount ]) => ({
        id: name,
        name: (
          <Typography variant="body2">
            <img src={itemImages[name]} style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain', width: '24px', height: '24px'}} alt={name} />
            {name}
          </Typography>
        ),
        amount: <Typography variant="body2" textAlign="right">{amount}</Typography>,
      }));
    const outputRows = Array.from(outputs.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ name, amount ]) => ({
      id: name,
      name: (
        <Typography variant="body2">
          <img src={itemImages[name]} style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain', width: '24px', height: '24px'}} alt={name} />
          {name}
        </Typography>
      ),
      amount: <Typography variant="body2" textAlign="right">{amount}</Typography>,
    }));

    return {inputs: inputRows, outputs: outputRows};
  }, [ritual, ritualCount, ironmanMode, noWaste]);

  return (
    <Grid spacing={3} container>
      <Grid item xs={6}>
        Inputs:
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="body1">Item</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Quantity</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inputs.map((row) =>
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Grid item xs={6}>
        Outputs:
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="body1">Item</Typography>
                </TableCell>
                <TableCell>
                  <Typography textAlign="right" variant="body1">Quantity</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outputs.map((row) =>
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export default CostTable;