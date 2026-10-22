import { useEffect, useState, type RefObject } from "react"

/**
 * Devuelve el ancho real del elemento apuntado por `ref` y lo vuelve a medir
 * cuando cambia.
 *
 * Los gráficos D3 se dimensionan a partir del ancho del contenedor. Medirlo una
 * sola vez al montar falla cuando el contenedor todavía no está maquetado (ancho
 * 0): el gráfico se dibuja dentro de un SVG de 0 px y queda invisible para
 * siempre, porque el efecto no vuelve a ejecutarse. Este hook observa el
 * elemento con ResizeObserver y expone el ancho actualizado; quien lo usa debe
 * esperar a `width > 0` antes de dibujar.
 */
export function useElementWidth<T extends Element>(ref: RefObject<T | null>) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const apply = (next: number) => setWidth((prev) => (prev === next ? prev : next))
    apply(Math.round(element.getBoundingClientRect().width))

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) apply(Math.round(entry.contentRect.width))
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return width
}
