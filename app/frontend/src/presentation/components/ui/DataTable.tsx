import type { ReactNode } from "react"

export interface DataTableColumn<T> {
  /** Identificador estable de la columna (no se renderiza). */
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: "left" | "right" | "center"
  /** Clases extra para el `<th>`. */
  headerClassName?: string
  /** Clases extra para el `<td>`. */
  cellClassName?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  skeletonRows?: number
  /** Se muestra cuando `rows` está vacío y no está cargando. Obligatorio: nunca una tabla en blanco. */
  emptyMessage: string
  onRowClick?: (row: T) => void
  className?: string
}

const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyMessage,
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={`p-5 space-y-2 ${className}`} aria-busy="true">
        {Array.from({ length: skeletonRows }, (_, index) => (
          <div key={index} className="h-10 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return <p className={`p-6 text-xs text-on-surface-variant ${className}`}>{emptyMessage}</p>
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-on-surface-variant bg-surface-container-high/60">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-2.5 font-bold ${ALIGN_CLASSES[column.align ?? "left"]} ${
                  column.headerClassName ?? ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/15">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`hover:bg-surface-container-high/40 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 ${ALIGN_CLASSES[column.align ?? "left"]} ${column.cellClassName ?? ""}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
