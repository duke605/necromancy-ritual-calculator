import { useState } from 'react';
import { Ritual, rituals } from '$src/classes';
import { Container, Stack } from '@mui/material';
import { CostTable, RitualConfig } from './components';

const App = () => {
  const [ ritual, setRitual ] = useState<Ritual>(rituals[0]);
  const [ ritualCount, setRitualCount ] = useState<number>(1);
  const [ ironmanMode, setIronmanMode ] = useState<boolean>(false);
  const [ noWaste, setNoWaste ] = useState<boolean>(false);

  return (
    <Container style={{paddingTop: '3rem'}}>
      <Stack spacing={3}>
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
        <CostTable
          ritual={ritual}
          ritualCount={ritualCount}
          ironmanMode={ironmanMode}
          noWaste={noWaste}
        />
      </Stack>
    </Container>
  )
}

export default App;