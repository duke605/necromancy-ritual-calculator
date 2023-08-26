import React, { useMemo } from 'react';
import { Glyph, Ritual, RitualModifier, rituals } from '$src/classes';
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from '@mui/material';
import { ucfirst } from '$src/lib/helpers';
import { itemImages } from '$src/lib/imageManifest';
import inks from '$data/inks.json';
import glyphData from '$data/glyphs.json';
import styles from './CostTable.module.css';
import { MultiplyGlyphNames } from '../..';

export interface CostTableProps {
  ritual: Ritual;
  ritualCount: number;
  ironmanMode: boolean;
  noWaste: boolean;
  prerequisiteCapeGlyph: MultiplyGlyphNames | 'none';
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

const TotalRow = ({
  name,
  value
}: {
  name: React.ReactNode,
  value: React.ReactNode,
}) => {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight="bold">{name}</Typography>  
      </TableCell>
      <TableCell>
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
}) => {
  const { inputs, outputs, ritualsToPerform } = useMemo(() => {
    const inputs = new Map<string, number>();
    const outputs = new Map<string, number>();
    const ritualsToPerform = [{ritual, count: ritualCount}];

    sumInputAndOutputs(ritual, ritualCount, inputs, outputs, ironmanMode);

    // Calculating cost to make necroplasm if ironman mode
    if (ironmanMode) {
      for (const necroplasm of [...necroplasmTiers].reverse()) {
        let ritualToMakeNecroplasm = rituals.find(r => r.name === necroplasm);
        const necroplasmNeeded = inputs.get(necroplasm) ?? 0;
        if (!ritualToMakeNecroplasm || necroplasmNeeded === 0) continue;

        // Adding tome to the ritual if it's on the ritual we're preforming
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

        // Adding tome if enabled
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

        // Calculating excess necroplasm
        const necroplasmMade = ritualToMakeNecroplasm.getOutputs(++n).find(({ name }) => name === necroplasm)!.amount;
        const excessNecroplasm = necroplasmMade - necroplasmNeeded;
        if (excessNecroplasm > 0) {
          const currentNecroplasmOutput = outputs.get(necroplasm) ?? 0;
          outputs.set(necroplasm, excessNecroplasm + currentNecroplasmOutput);
        }

        ritualsToPerform.push({ritual: ritualToMakeNecroplasm, count: n});
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
        amount: <Typography variant="body2" textAlign="right">{amount.toLocaleString()}</Typography>,
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
      amount: <Typography variant="body2" textAlign="right">{amount.toLocaleString()}</Typography>,
    }));

    return {inputs: inputRows, outputs: outputRows, ritualsToPerform: ritualsToPerform.reverse()};
  }, [ritual, ritualCount, ironmanMode, noWaste, prerequisiteCapeGlyph]);
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
        <Typography variant="h6">
          Outputs:
        </Typography>
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