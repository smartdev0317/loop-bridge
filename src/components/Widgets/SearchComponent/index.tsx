import { /* KeyboardEvent, */ useEffect, useState } from "react"
import styled, { ThemedStyledProps } from "styled-components"
import { FlexSpaceBetween } from "components/StyleComponents/FlexSpaceBetween"
import { GridDisplay } from "components/StyleComponents/GridDisplay"
import { SVGImage } from "components/Widgets/SVGImage"
// import SearchFilterText from "components/Widgets/SearchComponent/SearchFilterText"
import screenConfigs from "config/screenConfigs"

interface IStyledSearchComponentProps extends ThemedStyledProps<any, any> {
  show: boolean
}

const StyledSearchComponent = styled(GridDisplay) <IStyledSearchComponentProps>`
  position: absolute;
  left: 0;
  background: #2e2e2e;
  border-radius: 0px 0px 10px 10px;
  outline: 1px solid #1b1b1b;
  box-sizing: content-box;
  width: 100%;
  visibility: ${(props) => (props.show ? "visible" : "hidden")};
  transition: all 200ms;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow-y: scroll;

  @media ${screenConfigs.media.desktop} {
    max-height: ${(props) => (props.show ? "245px" : "0px")};
    transition: none;
    top: 126px;
  }
  @media ${screenConfigs.media.laptop} {
    max-height: ${(props) => (props.show ? "225px" : "0px")};
    transition: none;
    top: 112px;
  }
  @media ${screenConfigs.media.tablet} {
    max-height: ${(props) => (props.show ? "150px" : "0px")};
    top: 105px;
  }
  @media ${screenConfigs.media.mobile} {
    max-height: ${(props) => (props.show ? "150px" : "0px")};
    top: 105px;
  }
`

// const StyledBox = styled.div`
//   width: 100%;
//   height: 100%;
//   max-height: 100%;
//   overflow-y: scroll !important;
//   position: relative;

//   ::-webkit-scrollbar {
//     -webkit-appearance: none;
//     width: 10px;
//   }

//   ::-webkit-scrollbar-thumb {
//     border-radius: 5px;
//     background-color: rgba(0, 0, 0, 0.5);
//     -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
//   }
// `

export interface ISearchItem {
  title: string
  symbol?: string
  active: boolean
  disabled: boolean
  icon: any
  onClick: () => void
}

interface ISearchMenuProps {
  show: boolean
  allItems: ISearchItem[]
  handleClose: () => void
}

const SearchMenu = (props: ISearchMenuProps) => {
  const { handleClose, allItems, show } = props
  const [listItems, setListItems] = useState<ISearchItem[]>([])

  useEffect(() => {
    setListItems(allItems)
  }, [allItems])

  // console.log("allItems:", allItems)

  const onClick = (item: ISearchItem) => {
    item.onClick()
    handleClose && handleClose()
    setListItems(allItems) //reset list items so that when menu is reopened, all options show again
  }

  // const handleOnEnterPress = (e: KeyboardEvent<HTMLInputElement>) => {
  //   e.stopPropagation()
  //     ; (e.code === "Enter" || e.code === "NumpadEnter") &&
  //       listItems?.length === 1 &&
  //       !listItems[0].disabled &&
  //       onClick(listItems[0])
  // }

  return (
    <StyledSearchComponent show={show}>
      {show && (
        <>
          {/* <SearchFilterText
            unfilteredList={allItems}
            callback={(data: any[]) => setListItems(data)}
            show={props.show}
            handleOnEnterPress={handleOnEnterPress}
          /> */}
          {/* <StyledBox> */}
          {listItems.map((item: ISearchItem) => (
            <SearchOption
              key={item.title}
              title={item.title}
              icon={item.icon}
              disabled={item.disabled}
              onClick={(title: string) => !item.disabled && onClick(item)}
            />
          ))}
          {/* </StyledBox> */}
        </>
      )}
    </StyledSearchComponent>
  )
}

interface ISearchOption {
  title: string
  disabled: boolean
  icon: any
  onClick: (title: string) => void
}

interface IStyledSearchItemProps extends ThemedStyledProps<any, any> {
  disabled?: boolean
}

const StyledSearchItem = styled(FlexSpaceBetween) <IStyledSearchItemProps>`
  ${({ disabled }) => (disabled ? "" : "cursor: pointer")};
  box-sizing: border-box;
  width: 100%;
  padding: 10px 15px 10px 15px;
  box-sizing: border-box;
  color: white;
  letter-spacing: 0.78px;
  font-weight: bold;
  &:hover {
    color: ${({ disabled }) => (disabled ? "white" : "darkgray")};
  }
  transition: color 500ms;
`

const SearchOption = (props: ISearchOption) => {
  const { disabled, icon, onClick, title } = props
  let imageSrc
  try {
    imageSrc = icon
  } catch (e) {
    imageSrc = require(`assets/svg/select-chain-icon-black.svg`)?.default
  }
  return (
    <StyledSearchItem
      disabled={disabled}
      onClick={() => !disabled && onClick(title)}
    >
      <SVGImage height={"25px"} width={"25px"} src={imageSrc} />
      <div style={{ width: `85%` }}>{title}</div>
    </StyledSearchItem>
  )
}

export default SearchMenu
