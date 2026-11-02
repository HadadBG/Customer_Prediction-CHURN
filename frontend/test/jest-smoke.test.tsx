import { render, screen } from '@testing-library/react'
import { describe, test, expect } from '@jest/globals'

function TestComponent() {
    return <h1>Jest is working!</h1>
}

describe('Jest configuration', () => {

    test('should execute a basic assertion', () => {
        expect(1).toBe(1)
    })

    test('should render a React component', () => {
        render(<TestComponent />)

        expect(
            screen.getByText('Jest is working!')
        ).toBeInTheDocument()
    })

})