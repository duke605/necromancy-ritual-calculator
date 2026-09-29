/**
 * An item slot: its frame around whatever's in it, such as an item's icon (ItemImage, with its count),
 * a faint silhouette of what goes there, or nothing. An `invisible` one has no frame or fill, only its
 * size and layout, for items laid out bare, as the bank shows them.
 */
export function Slot({
  invisible,
  style,
  children,
}: {
  invisible?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className="slot" data-invisible={invisible || undefined} style={style}>
      {children}
    </div>
  );
}
