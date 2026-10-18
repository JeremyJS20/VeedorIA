interface Props {
  children: React.ReactNode
  className?: string
}

export default function SectionContainer({ children, className = '' }: Props) {
  return (
    <div className={`max-w-[1200px] mx-auto ${className}`}>
      {children}
    </div>
  )
}
