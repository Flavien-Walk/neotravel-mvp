interface Props { children: React.ReactNode; icon?: React.ReactNode }

export default function SectionLabel({ children, icon }: Props) {
  return (
    <span className="label-tag">
      {icon && <span className="text-neo-blue">{icon}</span>}
      {children}
    </span>
  )
}
