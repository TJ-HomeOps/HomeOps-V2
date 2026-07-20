interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <div
      style={{
        position: "relative",
        width: 320,
        maxWidth: "100%",
      }}
    >
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #374151",
          background: "#111827",
          color: "#f8fafc",
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );
}
