export const getPriceForItems = async (...items: string[]) => {
  const url = 'https://runescape.wiki/?title=Module:GEPrices/data.json&action=raw&ctype=application%2Fjson';
  const resp: Record<string, any> = await fetch(url, {
    method: 'POST',
  }).then(r => r.json());

  return items.reduce((map, item) => {
    map.set(item, resp[item] ?? 0);

    return map;
  }, new Map<string, number>());
}