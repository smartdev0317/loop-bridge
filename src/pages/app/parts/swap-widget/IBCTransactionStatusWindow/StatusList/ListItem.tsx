import screenConfigs from "config/screenConfigs"
import styled from "styled-components"

const StyledListItem = styled.div`
  height: 33%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media ${screenConfigs.media.desktop} {
    font-size: 18px;
  }
  @media ${screenConfigs.media.laptop} {
    font-size: 15px;
  }
  @media ${screenConfigs.media.tablet} {
    font-size: 12px;
  }
  @media ${screenConfigs.media.mobile} {
    font-size: 10px;
  }
`

interface IListItemProps {
  activeStep: number
  step: number
  text: any
  className?: string
}

export const ListItem = (props: IListItemProps) => {
  const { activeStep, className, step, text } = props

  return (
    <StyledListItem className={className}>
      <div
        style={{
          width: `80%`,
          height: `100%`,
          paddingLeft: '4em',
          display: `flex`,
          alignItems: `center`,
          color: activeStep >= step ? "black" : "lightgray",
        }}
      >
        {text}
      </div>
    </StyledListItem>
  )
}
