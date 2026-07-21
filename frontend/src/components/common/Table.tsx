import React from "react";
import colors from "../../theme/colors";

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];

  emptyText?: string;

  striped?: boolean;

  hoverable?: boolean;

  compact?: boolean;

  style?: React.CSSProperties;

  rowKey?: keyof T | ((row: T) => string | number);

  onRowClick?: (row: T) => void;
}

export default function Table<T extends object>({
  columns,
  data,

  emptyText = "No data available",

  striped = false,

  hoverable = true,

  compact = false,

  style,

  rowKey,

  onRowClick,
}: TableProps<T>) {
  const padding = compact ? "10px 14px" : "14px 18px";

  return (
    <div
      style={{
        overflowX: "auto",
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        ...style,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: colors.surfaceAlt,
            }}
          >
            {columns.map((column) => (
              <th
                key={column.title}
                style={{
                  textAlign: column.align ?? "left",

                  padding,

                  color: colors.textSecondary,

                  fontSize: 13,

                  fontWeight: 600,

                  borderBottom: `1px solid ${colors.border}`,

                  width: column.width,
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: colors.textMuted,
                }}
              >
                {emptyText}
              </td>
            </tr>
          )}

          {data.map((row, index) => (
            <tr
              key={
                typeof rowKey === "function"
                  ? rowKey(row)
                  : rowKey
                  ? String(row[rowKey])
                  : index
              }
              onClick={() => onRowClick?.(row)}
              style={{
                background:
                  striped && index % 2 === 1
                    ? colors.surfaceAlt
                    : colors.surface,

                cursor: onRowClick ? "pointer" : "default",

                transition: "background .15s ease",
              }}
              onMouseEnter={(e) => {
                if (hoverable) {
                  e.currentTarget.style.background = colors.surfaceAlt;
                }
              }}
              onMouseLeave={(e) => {
                if (hoverable) {
                  e.currentTarget.style.background =
                    striped && index % 2 === 1
                      ? colors.surfaceAlt
                      : colors.surface;
                }
              }}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  style={{
                    padding,

                    color: colors.text,

                    borderBottom: `1px solid ${colors.border}`,

                    textAlign: column.align ?? "left",
                  }}
                >
                  {column.render
                    ? column.render(row)
                    : String(
                        row[column.key as keyof T] ?? ""
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
