import { useState } from 'react';
import { Ritual, rituals } from '$src/classes';
import { Container, Grid } from '@mui/material';
import { CostTable, RitualConfig } from './components';

const App = () => {
  const [ ritual, setRitual ] = useState<Ritual>(rituals[0]);
  const [ ritualCount, setRitualCount ] = useState<number>(1);
  const [ ironmanMode, setIronmanMode ] = useState<boolean>(false);
  const [ noWaste, setNoWaste ] = useState<boolean>(false);

  return (
    <Container style={{paddingTop: '3rem', paddingBottom: '3rem'}}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RitualConfig
            ritual={ritual}
            ritualCount={ritualCount}
            ironmanMode={ironmanMode}
            noWaste={noWaste}
            onChangeRitual={setRitual}
            onChangeRitualCount={setRitualCount}
            onChangeIronmanMode={setIronmanMode}
            onChangeNoWaste={setNoWaste}
          />
        </Grid>
        <Grid item xs={12}>
          <CostTable
            ritual={ritual}
            ritualCount={ritualCount}
            ironmanMode={ironmanMode}
            noWaste={noWaste}
          />
        </Grid>
      </Grid>
    </Container>
  )
}

export default App;