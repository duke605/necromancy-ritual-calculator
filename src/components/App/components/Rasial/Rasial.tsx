import imgRasial from '$assets/raisial_head.webp';
import { useState } from 'react';
import styles from './Rasial.module.css';

const Rasial = () => {
  const [ visible, setVisible ] = useState(Math.random() <= 0.02);
  const [ imageLoaded, setImageLoaded ] = useState(false);

  return !visible ? null : (
    <div className={styles.rasial} title="Click to dismiss" onClick={() => setVisible(false)}>
      {imageLoaded && <p className={styles.message}>+4 Hero Points</p>}
      <img src={imgRasial} alt="Rasial" onLoad={() => setImageLoaded(true)}/>
    </div>
  );
}

export default Rasial;