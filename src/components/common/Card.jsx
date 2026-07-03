// A simple white rounded box used to group content throughout the app.
export default function Card({ children, onClick, style }) {
  return <div className="card" onClick={onClick} style={style}>{children}</div>
}
