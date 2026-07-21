export default function Topbar() {
  return (
    <header
      style={{
        height: 70,
        background: "#182232",
        borderBottom: "1px solid #27364b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        HomeOps
      </div>

      <div
        style={{
          color: "#94a3b8",
        }}
      >
        v2
      </div>
    </header>
  );
}
