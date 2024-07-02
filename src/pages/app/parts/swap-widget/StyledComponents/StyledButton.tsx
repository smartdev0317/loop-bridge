import styled, { ThemedStyledProps } from "styled-components"

interface IStyledButtonProps extends ThemedStyledProps<any, any> {
    dim?: boolean
}

const StyledButton = styled.button<IStyledButtonProps>`
    padding: 16px 8px;
    width: 100%;
    background-color: rgb(191, 32, 171);
    font-size: 16px;
    text-align: center;
    border-radius: 10px;
    border-style: none;
    box-sizing: border-box;
    user-select: none;
    font-weight: 500;
    cursor: pointer;
    color: ${(props) => (props.dim ? "#565656" : "white")};
    transition: color 1000ms;
`

export default StyledButton
