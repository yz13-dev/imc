type IconProps = React.SVGProps<SVGSVGElement>


function ImcIcon({ width = "100%", height = "100%", viewBox = "0 0 42 50", fill = "none", xmlns = "http://www.w3.org/2000/svg", ...props }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill={fill}
      xmlns={xmlns}
      {...props}
    >
      <path d="M11.2 38.8889V44.4444H5.6V38.8889H11.2Z" fill="var(--foreground)" />
      <path d="M36.4 38.8889V44.4444H30.8V38.8889H36.4Z" fill="var(--foreground)" />
      <path d="M14 5.55556V13.8889H8.4V5.55556H14Z" fill="var(--foreground)" />
      <path d="M28 6.62274e-07V5.55556H14V0L28 6.62274e-07Z" fill="var(--foreground)" />
      <path d="M39.2 13.8889V22.2222H33.6V13.8889H39.2Z" fill="var(--foreground)" />
      <path d="M33.6 5.55556V13.8889H28V5.55556H33.6Z" fill="var(--foreground)" />
      <path d="M8.4 13.8889V22.2222H2.8V13.8889H8.4Z" fill="var(--foreground)" />
      <path d="M5.6 22.2222V38.8889H0V22.2222H5.6Z" fill="var(--foreground)" />
      <path d="M42 22.2222V38.8889H36.4V22.2222H42Z" fill="var(--foreground)" />
      <path d="M30.8 50H11.2V44.4444H30.8V50Z" fill="var(--foreground)" />
      <path d="M11.2 38.8889V44.4444H30.8V38.8889H36.4V22.2222H33.6V13.8889H28V5.55556H14V13.8889H8.4V22.2222H5.6V38.8889H11.2Z" fill="var(--foreground)" fillOpacity="0.5" />
    </svg>
  )
}

function ImcWithTextIcon({ width = "100%", height = "100%", viewBox = "0 0 165 50", fill = "none", xmlns = "http://www.w3.org/2000/svg", ...props }: IconProps) {
  return (
    <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns={xmlns} {...props}>
      <path d="M11.2 38.8889V44.4444H5.6V38.8889H11.2Z" fill="var(--foreground)" />
      <path d="M36.4 38.8889V44.4444H30.8V38.8889H36.4Z" fill="var(--foreground)" />
      <path d="M14 5.55556V13.8889H8.4V5.55556H14Z" fill="var(--foreground)" />
      <path d="M28 6.62274e-07V5.55556H14V0L28 6.62274e-07Z" fill="var(--foreground)" />
      <path d="M39.2 13.8889V22.2222H33.6V13.8889H39.2Z" fill="var(--foreground)" />
      <path d="M33.6 5.55556V13.8889H28V5.55556H33.6Z" fill="var(--foreground)" />
      <path d="M8.4 13.8889V22.2222H2.8V13.8889H8.4Z" fill="var(--foreground)" />
      <path d="M5.6 22.2222V38.8889H0V22.2222H5.6Z" fill="var(--foreground)" />
      <path d="M42 22.2222V38.8889H36.4V22.2222H42Z" fill="var(--foreground)" />
      <path d="M30.8 50H11.2V44.4444H30.8V50Z" fill="var(--foreground)" />
      <path d="M11.2 38.8889V44.4444H30.8V38.8889H36.4V22.2222H33.6V13.8889H28V5.55556H14V13.8889H8.4V22.2222H5.6V38.8889H11.2Z" fill="var(--foreground)" fillOpacity="0.5" />
      <path d="M58 46V39.4681H63.9521V10.5972H58V4H76.5103V10.5972H70.4928V39.4681H76.5103V46H58Z" fill="var(--foreground)" />
      <path d="M84.444 46V9.94401H90.3961V4H96.9369V9.94401H102.954V21.7667H108.187V9.94401H114.204V4H120.811V9.94401H126.697V46H120.157V10.5972H114.859V22.3546H108.841V40.1213H102.3V22.3546H96.2828V10.5972H91.0502V46H84.444Z" fill="var(--foreground)" />
      <path d="M140.538 46V40.1213H134.586V9.94401H140.538V4H158.983V9.94401H165V22.3546H158.328V10.5972H141.192V39.4681H158.328V27.5801H165V40.1213H158.983V46H140.538Z" fill="var(--foreground)" />
    </svg>
  )
}

export { ImcIcon, ImcWithTextIcon }
export type { IconProps }

