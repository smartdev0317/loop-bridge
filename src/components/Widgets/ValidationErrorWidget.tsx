import styled, { ThemedStyledProps } from "styled-components"
import screenConfigs from "config/screenConfigs"

const StyledValidationErrorWidget = styled.div<ThemedStyledProps<any, any>>`
  width: 100%;
  margin: 30px auto 5px;
  padding: 0.2em;
  box-sizing: border-box;
  border-radius: 9px;
  // box-shadow: inset 0 0 3px 0 #262426;
  // border: solid 1px #e90a42;
  // background-color: #fff;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #d64c55;
  ${(props) =>
    props.visibility
      ? `visibility: ${props.visibility}`
      : ``};

  @media ${screenConfigs.media.desktop} {
    margin-top: 25px;
    padding: 0.75em;
    font-size: 1em;
  }
  @media ${screenConfigs.media.laptop} {
    margin-top: 20px;
  }
  @media ${screenConfigs.media.tablet} {
    margin-top: 15px;
  }
  @media ${screenConfigs.media.mobile} {
    margin-top: 10px;
  }
`

// const StyledImage = styled.img<ThemedStyledProps<any, any>>`
//   height: 0.625em;
//   width: 0.625em;
//   ${(props) =>
//     props.marginSm
//       ? `margin-left: ${props.marginSm}; margin-right: ${props.marginSm};`
//       : ``};

//   @media ${screenConfigs.media.desktop} {
//     ${(props) =>
//     props.marginLg
//       ? `margin-left: ${props.marginLg}; margin-right: ${props.marginLg};`
//       : ``};
//   }
// `

const ValidationErrorWidget = ({ text, visibility }: { text: string, visibility?: string }) => {
  return (
    <StyledValidationErrorWidget visibility={visibility}>
      {/* <StyledImage
        src={require(`assets/svg/error-dot.svg`).default}
        alt={""}
        marginSm={`-6px`}
        marginLg={`-20px`}
      /> */}
      {text}
      {/* <StyledImage
        src={require(`assets/svg/error-dot.svg`).default}
        alt={""}
        marginSm={`-6px`}
        marginLg={`-20px`}
      /> */}
    </StyledValidationErrorWidget>
  )
}

export default ValidationErrorWidget
