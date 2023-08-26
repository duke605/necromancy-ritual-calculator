import { ChangeEvent, useId, useState } from 'react';
import { Glyph, Ritual, rituals } from '$src/classes';
import { Avatar, Button, Checkbox, Chip, FormControl, Grid, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, useEventCallback } from '@mui/material';
import { MAX_GLYPHS } from '$constants';
import { itemImages } from '$src/lib/imageManifest';
import glyphData from '$data/glyphs.json';
import styles from './RitualConfig.module.css';
import imgSoulInactive from '$assets/soul_inactive.png';
import imgSoulActive from '$assets/soul_active.webp';

export interface RitualConfigProps {
  ritual: Ritual;
  ritualCount: number;
  ironmanMode: boolean;
  noWaste: boolean;
  onChangeRitual: (ritual: Ritual) => void;
  onChangeRitualCount: (ritualCount: number) => void;
  onChangeIronmanMode: (ironmanMode: boolean) => void;
  onChangeNoWaste: (noWaste: boolean) => void;
}

type GlyphName = keyof typeof glyphData;

const sortedGlyphes = Object.entries(glyphData).map(([name, data]) => ({
  ...data,
  name,
})).sort((a, b) => a.name.localeCompare(b.name)) as Omit<Glyph, 'amount'>[];

const sortedAlterationGlyphs = sortedGlyphes.filter(g => g.alteration);

/**
 * Applies a glyph to a ritual as a modifier if the glyph is valid
 * 
 * @param modifierId the modifier id
 * @param glyphName the name of the glyph to add as a modifier
 * @param ritual the ritual to modify
 * @param extra extra information about the modifier
 * @param applies a function that determines if the modifier should apply to the ritual
 * @returns the new ritual with the modifier applied if the glyph was found
 */
const applyGlyphAsModifierToRitual = (
  modifierId: string,
  glyphName: GlyphName,
  ritual: Ritual,
  extra?: Record<string, any>,
) => {
  const glyph = glyphData[glyphName] as Omit<Glyph, 'name' | 'amount'>;
  
  if (glyph && glyph.alteration) {
    ritual = ritual.putModifiers({
      id: modifierId,
      duration: glyph.duration,
      soulAttraction: glyph.soulAttraction,
      multiplier: glyph.multiply,
      extra,
    });
  } else {
    ritual = ritual.removeModifier(modifierId);
  }

  return ritual;
}

const RitualConfig: React.FC<RitualConfigProps> = ({
  ritual,
  ritualCount,
  ironmanMode,
  noWaste,
  onChangeRitual,
  onChangeRitualCount,
  onChangeIronmanMode,
  onChangeNoWaste,
}) => {
  const [ selectedAlteractionGlyph, setSelectedAlterationGlyph ] = useState(sortedAlterationGlyphs[0].name as GlyphName);

  const goldenRatio = ritual.getGoldenRatio();
  const openGlyphSlots = MAX_GLYPHS - ritual.getGlyphCount();
  const soulAttraction = ritual.getSoulAttraction();
  const durationSeconds = ritual.getDuration();
  const multiplier = ritual.getMultiplier();
  const selectedCapeGlyph = ritual.getModifier('cape')?.extra?.glyph ?? 'none';

  const ritualLabelId = useId();
  const ritualFocusLabelId = useId();
  const capeAlterationGlyphLabelId = useId();
  const alterationGlyphsLabelId = useId();
  const settingsLabelId = useId();

  /**
   * Changes the ritual
   */
  const handleChangeRitual = useEventCallback((e: SelectChangeEvent<string>) => {
    let newRitual = rituals.find(r => r.name === e.target.value)!;

    // Adding the modifiers from the old ritual to the new one
    newRitual = newRitual.putModifiers(...ritual.getModifiers().values());

    onChangeRitual(newRitual);
  });

  /**
   * Sets the focus of the current ritual
   */
  const handleChangeRitualFocus = useEventCallback((e: SelectChangeEvent<string>) => {
    onChangeRitual(ritual.setFocus(e.target.value));
  });

  /**
   * Sets the number of rituals wanting to be performed
   */
  const handleChangeRitualCount = useEventCallback((e: ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value.trim());
    if (isNaN(n)) {
      onChangeRitualCount(1);
      return;
    }

    onChangeRitualCount(Math.max(1, n));
  });

  /**
   * Adds a alteraction glyph to the ritual
   */
  const handleAddAlterationGlyph = useEventCallback(() => {
    onChangeRitual(ritual.addAlterationGlyph(selectedAlteractionGlyph, 1));
  });

  /**
   * Changes the cape modifier on the ritual
   */
  const handleChangeCapeModifier = useEventCallback((e: SelectChangeEvent) => {
    const newRitual = applyGlyphAsModifierToRitual('cape', e.target.value as GlyphName, ritual, {
      glyph: e.target.value as GlyphName,
    });

    onChangeRitual(newRitual);
  });

  const handleChangeTomeOfUm = useEventCallback((e: boolean) => {
    if (e) {
      onChangeRitual(ritual.putModifiers({
        id: 'tomeOfUm',
        necroplasmMultiplier: 5,
      }));
    } else {
      onChangeRitual(ritual.removeModifier('tomeOfUm'));
    }
  });
  
  const settings = [
    {name: 'Ironman Mode', value: ironmanMode, onChange: onChangeIronmanMode},
    {name: 'No Waste', value: noWaste, onChange: onChangeNoWaste, hide: !ironmanMode, indent: true},
    {name: 'Tome of Um', value: !!ritual.getModifier('tomeOfUm'), onChange: handleChangeTomeOfUm},
  ];

  return (
    <Grid container spacing={3}>
      {}
      <Grid item xs={4}>
        <FormControl fullWidth>
          <InputLabel id={ritualLabelId}>Ritual</InputLabel>
          <Select value={ritual.name} onChange={handleChangeRitual} fullWidth label="Ritual" labelId={ritualLabelId}>
            {rituals.map(r => <MenuItem key={r.name} value={r.name}>{r.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={4}>
        <FormControl fullWidth>
          <InputLabel id={ritualFocusLabelId}>Ritual Focus</InputLabel>
          <Select
            value={ritual.getFocus().input.name}
            onChange={handleChangeRitualFocus}
            disabled={ritual.focusCount === 1}
            fullWidth
            label="Ritual Focus"
            labelId={ritualFocusLabelId}
          >
            {ritual.focuses.map(f => 
              <MenuItem key={f.input.name} value={f.input.name}>
                <img src={itemImages[f.input.name]} width="20" height="20" style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain'}} />
                {f.input.name}
              </MenuItem>)
            }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={4} alignSelf="end">
        <TextField
          className={ritualCount % goldenRatio === 0 ? styles.goldenRatioMet : ''}
          defaultValue={ritualCount}
          label={`Ritual Count (Golden Ratio: ${goldenRatio})`}
          onChange={handleChangeRitualCount}
          type="number"
          fullWidth
          variant="standard"
        />
      </Grid>
      <Grid item xs={3}>
        <FormControl fullWidth>
          <InputLabel id={alterationGlyphsLabelId}>Alteration Glyphs</InputLabel>
          <Select
            value={selectedAlteractionGlyph}
            onChange={(e) => setSelectedAlterationGlyph(e.target.value as GlyphName)}
            fullWidth
            label="Alteration Glyphs"
            labelId={alterationGlyphsLabelId}
          >
            {sortedAlterationGlyphs.filter(g => g.alteration).map(g =>
              <MenuItem key={g.name} value={g.name}>
                <img src={g.image} width="20" height="20" style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain'}}/>
                {g.name}
              </MenuItem>)
            }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={1}>
        <Button
          onClick={handleAddAlterationGlyph}
          disabled={openGlyphSlots <= 0}
          variant="contained"
          style={{height: '100%'}}
          fullWidth
          size="large"
          children="Add"
        />
      </Grid>
      <Grid item xs={4}>
        <FormControl fullWidth>
          <InputLabel id={capeAlterationGlyphLabelId}>Cape Alteration Glyph</InputLabel>
          <Select value={selectedCapeGlyph} onChange={handleChangeCapeModifier} fullWidth label="Cape Alteration Glyph" labelId={capeAlterationGlyphLabelId}>
            <MenuItem value="none">None</MenuItem>
            {sortedAlterationGlyphs.filter(g => g.alteration).map(g =>
              <MenuItem key={g.name} value={g.name}>
                <img src={g.image} width="20" height="20" style={{marginRight: '0.5rem', verticalAlign: 'middle', objectFit: 'contain'}}/>
                {g.name}
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={4} alignSelf="center">
        <FormControl fullWidth>
          <InputLabel id={settingsLabelId}>Additional Settings</InputLabel>
          <Select
            multiple
            fullWidth
            value={settings.filter(s => s.value && !s.hide)}
            renderValue={settings => settings
              .filter(s => s.value)
              .map(s => s.name)
              .join(', ')
            }
            input={<OutlinedInput label="Settings" />}
            labelId={settingsLabelId}
          >
            {settings.filter(s => !s.hide).map(s =>
              <MenuItem key={s.name} value={s.name} onClick={() => s.onChange(!s.value)} style={{paddingLeft: s.indent ? '1rem' : '0rem'}}>
                <Checkbox checked={s.value} />
                <ListItemText primary={s.name} />
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" spacing={1}>
          {ritual.getAlterationGlyphs().map((glyph, i) =>
            <Chip
              avatar={<Avatar src={glyph.image} />}
              key={`${glyph.name}-${i}`}
              label={glyph.name}
              style={{height: '100%'}}
              onDelete={() => onChangeRitual(ritual.removeAlterationGlyph(glyph.name))}
            />
          )}
        </Stack>
      </Grid>
      <Grid item xs={12} textAlign="center">
        <Stack spacing={1}>
          <Stack>
            <span>Duration: {durationSeconds} seconds</span>
            <span>Multiplier: {Math.round(multiplier * 100)}%</span>
            <span>Soul Attraction: {Math.round(soulAttraction * 100)}%</span>
          </Stack>
          <Stack direction="row" spacing={0.5} justifyContent="center">
            {([[0, 'Low'], [1, 'Medium'], [2, 'High'], [3, 'Extreme'], [5, 'Dangerous']] as const).map(([ sa, name ]) =>
              <img
                title={name}
                key={name}
                src={soulAttraction > sa ? imgSoulActive : imgSoulInactive}
                width="32"
                height="32"
              />  
            )}
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default RitualConfig;